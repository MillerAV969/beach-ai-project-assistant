import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.contacts import ContactsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/contacts", tags=["contacts"])


# ---------- Pydantic Schemas ----------
class ContactsData(BaseModel):
    """Entity data schema (for create/update)"""
    project_id: int
    name: str
    role: str = None
    email: str = None
    phone: str = None
    company: str = None


class ContactsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    project_id: Optional[int] = None
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None


class ContactsResponse(BaseModel):
    """Entity response schema"""
    id: int
    project_id: int
    name: str
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContactsListResponse(BaseModel):
    """List response schema"""
    items: List[ContactsResponse]
    total: int
    skip: int
    limit: int


class ContactsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[ContactsData]


class ContactsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: ContactsUpdateData


class ContactsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[ContactsBatchUpdateItem]


class ContactsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=ContactsListResponse)
async def query_contactss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query contactss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying contactss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = ContactsService(db)
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
        logger.debug(f"Found {result['total']} contactss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying contactss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=ContactsListResponse)
async def query_contactss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query contactss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying contactss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = ContactsService(db)
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
        logger.debug(f"Found {result['total']} contactss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying contactss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=ContactsResponse)
async def get_contacts(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single contacts by ID (user can only see their own records)"""
    logger.debug(f"Fetching contacts with id: {id}, fields={fields}")
    
    service = ContactsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Contacts with id {id} not found")
            raise HTTPException(status_code=404, detail="Contacts not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching contacts {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=ContactsResponse, status_code=201)
async def create_contacts(
    data: ContactsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new contacts"""
    logger.debug(f"Creating new contacts with data: {data}")
    
    service = ContactsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create contacts")
        
        logger.info(f"Contacts created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating contacts: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating contacts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[ContactsResponse], status_code=201)
async def create_contactss_batch(
    request: ContactsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple contactss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} contactss")
    
    service = ContactsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} contactss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[ContactsResponse])
async def update_contactss_batch(
    request: ContactsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple contactss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} contactss")
    
    service = ContactsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} contactss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=ContactsResponse)
async def update_contacts(
    id: int,
    data: ContactsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing contacts (requires ownership)"""
    logger.debug(f"Updating contacts {id} with data: {data}")

    service = ContactsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Contacts with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Contacts not found")
        
        logger.info(f"Contacts {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating contacts {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating contacts {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_contactss_batch(
    request: ContactsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple contactss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} contactss")
    
    service = ContactsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} contactss successfully")
        return {"message": f"Successfully deleted {deleted_count} contactss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_contacts(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single contacts by ID (requires ownership)"""
    logger.debug(f"Deleting contacts with id: {id}")
    
    service = ContactsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Contacts with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Contacts not found")
        
        logger.info(f"Contacts {id} deleted successfully")
        return {"message": "Contacts deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contacts {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")