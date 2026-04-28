import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.resources import ResourcesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/resources", tags=["resources"])


# ---------- Pydantic Schemas ----------
class ResourcesData(BaseModel):
    """Entity data schema (for create/update)"""
    project_id: int
    title: str
    type: str
    url: str = None
    description: str = None


class ResourcesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    project_id: Optional[int] = None
    title: Optional[str] = None
    type: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None


class ResourcesResponse(BaseModel):
    """Entity response schema"""
    id: int
    project_id: int
    title: str
    type: str
    url: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ResourcesListResponse(BaseModel):
    """List response schema"""
    items: List[ResourcesResponse]
    total: int
    skip: int
    limit: int


class ResourcesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[ResourcesData]


class ResourcesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: ResourcesUpdateData


class ResourcesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[ResourcesBatchUpdateItem]


class ResourcesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=ResourcesListResponse)
async def query_resourcess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query resourcess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying resourcess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = ResourcesService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} resourcess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying resourcess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=ResourcesListResponse)
async def query_resourcess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query resourcess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying resourcess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = ResourcesService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} resourcess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying resourcess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=ResourcesResponse)
async def get_resources(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single resources by ID (user can only see their own records)"""
    logger.debug(f"Fetching resources with id: {id}, fields={fields}")
    
    service = ResourcesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Resources with id {id} not found")
            raise HTTPException(status_code=404, detail="Resources not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching resources {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=ResourcesResponse, status_code=201)
async def create_resources(
    data: ResourcesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new resources"""
    logger.debug(f"Creating new resources with data: {data}")
    
    service = ResourcesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create resources")
        
        logger.info(f"Resources created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating resources: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating resources: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[ResourcesResponse], status_code=201)
async def create_resourcess_batch(
    request: ResourcesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple resourcess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} resourcess")
    
    service = ResourcesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} resourcess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[ResourcesResponse])
async def update_resourcess_batch(
    request: ResourcesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple resourcess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} resourcess")
    
    service = ResourcesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} resourcess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=ResourcesResponse)
async def update_resources(
    id: int,
    data: ResourcesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing resources (requires ownership)"""
    logger.debug(f"Updating resources {id} with data: {data}")

    service = ResourcesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Resources with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Resources not found")
        
        logger.info(f"Resources {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating resources {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating resources {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_resourcess_batch(
    request: ResourcesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple resourcess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} resourcess")
    
    service = ResourcesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} resourcess successfully")
        return {"message": f"Successfully deleted {deleted_count} resourcess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_resources(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single resources by ID (requires ownership)"""
    logger.debug(f"Deleting resources with id: {id}")
    
    service = ResourcesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Resources with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Resources not found")
        
        logger.info(f"Resources {id} deleted successfully")
        return {"message": "Resources deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting resources {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")