import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.finances import FinancesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/finances", tags=["finances"])


# ---------- Pydantic Schemas ----------
class FinancesData(BaseModel):
    """Entity data schema (for create/update)"""
    project_id: int
    item: str
    type: str
    amount: float
    date: str = None
    description: str = None


class FinancesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    project_id: Optional[int] = None
    item: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None


class FinancesResponse(BaseModel):
    """Entity response schema"""
    id: int
    project_id: int
    item: str
    type: str
    amount: float
    date: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FinancesListResponse(BaseModel):
    """List response schema"""
    items: List[FinancesResponse]
    total: int
    skip: int
    limit: int


class FinancesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[FinancesData]


class FinancesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: FinancesUpdateData


class FinancesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[FinancesBatchUpdateItem]


class FinancesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=FinancesListResponse)
async def query_financess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query financess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying financess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = FinancesService(db)
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
        logger.debug(f"Found {result['total']} financess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying financess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=FinancesListResponse)
async def query_financess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query financess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying financess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = FinancesService(db)
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
        logger.debug(f"Found {result['total']} financess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying financess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=FinancesResponse)
async def get_finances(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single finances by ID (user can only see their own records)"""
    logger.debug(f"Fetching finances with id: {id}, fields={fields}")
    
    service = FinancesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Finances with id {id} not found")
            raise HTTPException(status_code=404, detail="Finances not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching finances {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=FinancesResponse, status_code=201)
async def create_finances(
    data: FinancesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new finances"""
    logger.debug(f"Creating new finances with data: {data}")
    
    service = FinancesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create finances")
        
        logger.info(f"Finances created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating finances: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating finances: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[FinancesResponse], status_code=201)
async def create_financess_batch(
    request: FinancesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple financess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} financess")
    
    service = FinancesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} financess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[FinancesResponse])
async def update_financess_batch(
    request: FinancesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple financess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} financess")
    
    service = FinancesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} financess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=FinancesResponse)
async def update_finances(
    id: int,
    data: FinancesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing finances (requires ownership)"""
    logger.debug(f"Updating finances {id} with data: {data}")

    service = FinancesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Finances with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Finances not found")
        
        logger.info(f"Finances {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating finances {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating finances {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_financess_batch(
    request: FinancesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple financess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} financess")
    
    service = FinancesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} financess successfully")
        return {"message": f"Successfully deleted {deleted_count} financess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_finances(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single finances by ID (requires ownership)"""
    logger.debug(f"Deleting finances with id: {id}")
    
    service = FinancesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Finances with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Finances not found")
        
        logger.info(f"Finances {id} deleted successfully")
        return {"message": "Finances deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting finances {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")