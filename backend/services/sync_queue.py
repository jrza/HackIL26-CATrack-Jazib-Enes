import asyncio
import logging

logger = logging.getLogger(__name__)

_queue: list[dict] = []
_lock = asyncio.Lock()


def enqueue(item: dict) -> None:
    """Add an item to the offline sync queue (thread-safe append)."""
    _queue.append(item)
    logger.debug("Item enqueued; queue size is now %d.", len(_queue))


async def flush_queue(supabase_client) -> int:
    """Push all queued items to Supabase. Returns the number of items successfully synced."""
    async with _lock:
        if not _queue:
            return 0

        if supabase_client is None:
            logger.warning("Supabase client is unavailable; cannot flush queue.")
            return 0

        items_to_flush = list(_queue)
        synced = 0
        failed: list[dict] = []

        for item in items_to_flush:
            table = item.get("_table")
            payload = {k: v for k, v in item.items() if k != "_table"}

            if not table:
                logger.error("Queued item missing '_table' key; skipping: %s", item)
                failed.append(item)
                continue

            try:
                result = supabase_client.table(table).insert(payload).execute()
                if result.data:
                    synced += 1
                else:
                    logger.warning("Supabase insert returned no data for item: %s", payload)
                    failed.append(item)
            except Exception as exc:
                logger.error("Failed to sync item to Supabase table '%s': %s", table, exc)
                failed.append(item)

        _queue.clear()
        _queue.extend(failed)

        logger.info("Queue flush complete: %d synced, %d failed.", synced, len(failed))
        return synced


def get_queue_size() -> int:
    """Return the number of items currently in the offline queue."""
    return len(_queue)


def get_queue() -> list[dict]:
    """Return a copy of the current offline queue."""
    return list(_queue)
