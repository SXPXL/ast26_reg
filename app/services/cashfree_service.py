import json
import logging
from typing import Any, Dict, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class CashfreeService:
    @property
    def app_id(self) -> str:
        return settings.CASHFREE_APP_ID.strip('\'"')

    @property
    def secret_key(self) -> str:
        return settings.CASHFREE_SECRET_KEY.strip('\'"')

    @property
    def api_version(self) -> str:
        return settings.CASHFREE_API_VERSION.strip('\'"')

    @property
    def is_sandbox(self) -> bool:
        if self.secret_key.startswith("cfsk_ma_prod_") or settings.CASHFREE_ENVIRONMENT.upper() == "PRODUCTION":
            return False
        return True

    @property
    def base_url(self) -> str:
        return "https://sandbox.cashfree.com/pg" if self.is_sandbox else "https://api.cashfree.com/pg"

    @property
    def env_mode(self) -> str:
        return "sandbox" if self.is_sandbox else "production"

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

        # Cashfree production strictly mandates an https:// return URL
        if not self.is_sandbox and return_url.startswith("http://"):
            return_url = return_url.replace("http://", "https://", 1)

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
                **({"notify_url": settings.CASHFREE_NOTIFY_URL} if settings.CASHFREE_NOTIFY_URL else {}),
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
                "environment": self.env_mode,
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
                data["is_mock"] = False
                data["environment"] = self.env_mode
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

    async def get_order_payments(self, order_id: str) -> list:
        """Fetch individual payment attempts for an order from Cashfree."""
        if self.app_id.startswith("TEST_CASHFREE") or not self.app_id:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/orders/{order_id}/payments",
                    headers=self._get_headers(),
                )
                if response.status_code == 200:
                    return response.json()
                return []
        except Exception as exc:
            logger.warning(f"Could not fetch payments for order {order_id}: {str(exc)}")
            return []


cashfree_service = CashfreeService()

