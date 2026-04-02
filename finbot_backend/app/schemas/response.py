from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    """
    Standard API Response Wrapper.
    """
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    message: Optional[str] = None # For success messages or additional context
    metadata: Optional[dict[str, Any]] = None
