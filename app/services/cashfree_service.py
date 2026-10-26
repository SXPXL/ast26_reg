import json
import logging
from typing import Any, Dict, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class CashfreeService:
    def __init__(self):
        self.app_id = settings.CASHFREE_APP_ID
        self.secret_key = settings.CASHFREE_SECRET_KEY
        self.api_version = settings.CASHFREE_API_VERSION
        self.is_sandbox = settings.CASHFREE_ENVIRONMENT.upper() == "SANDBOX"
        
        self.base_url = (
            "https://sandbox.cashfree.com/pg"
            if self.is_sandbox
            else "https://api.cashfree.com/pg"
        )

    def _get_headers(self) -> Dict[str, str]:
        return {
            "x-client-id": self.app_id,
            "x-client-secret": self.secret_key,
            "x-api-version": self.api_version,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def create_order(
        self,
        order_id: str,
        order_amount: float,
        customer_id: str,
        customer_name: str,
        customer_email: str,
        customer_phone: str,
        return_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Creates a Cashfree PG order and returns payment_session_id.
        Gracefully handles mock/test keys for development offline testing.
        """
        if return_url is None:
            return_url = settings.CASHFREE_RETURN_URL

        payload = {
            "order_id": order_id,
            "order_amount": float(order_amount),
            "order_currency": "INR",
            "customer_details": {
                "customer_id": str(customer_id),
                "customer_name": customer_name,
                "customer_email": customer_email,
                "customer_phone": customer_phone[-10:],  # Ensure 10 digits
            },
            "order_meta": {
                "return_url": return_url,
            },
            "order_note": f"Fest Registration {order_id}",
        }

        # If dummy/test credentials, provide mock session response for offline testing
        if self.app_id.startswith("TEST_CASHFREE") or not self.app_id:
            logger.info("Using mock Cashfree order response (test credentials detected)")
            return {
                "cf_order_id": order_id,
                "order_id": order_id,
                "payment_session_id": f"session_mock_{order_id}",
                "order_status": "ACTIVE",
                "order_amount": order_amount,
                "order_currency": "INR",
                "is_mock": True,
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.base_url}/orders",
                    json=payload,
                    headers=self._get_headers(),
                )
                response.raise_for_status()
                data = response.json()
                return data
        except httpx.HTTPStatusError as exc:
            logger.error(f"Cashfree create order error: {exc.response.text}")
            raise Exception(f"Cashfree Gateway Error: {exc.response.text}")
        except Exception as exc:
            logger.error(f"Cashfree connection failed: {str(exc)}")
            raise Exception(f"Failed to connect to Cashfree payment gateway: {str(exc)}")

    async def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """Fetch order status from Cashfree."""
        if self.app_id.startswith("TEST_CASHFREE") or not self.app_id:
            logger.info(f"Returning mock paid status for order: {order_id}")
            return {
                "order_id": order_id,
                "order_status": "PAID",
                "order_amount": 100.00,
                "order_currency": "INR",
                "payment_status": "SUCCESS",
                "is_mock": True,
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{self.base_url}/orders/{order_id}",
                    headers=self._get_headers(),
                )
                response.raise_for_status()
                return response.json()
        except Exception as exc:
            logger.error(f"Failed to fetch Cashfree order {order_id}: {str(exc)}")
            raise Exception(f"Unable to fetch order status from Cashfree: {str(exc)}")


cashfree_service = CashfreeService()
