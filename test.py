import asyncio
import aiohttp
import time

API_URL = "https://twittervideodownloader.up.railway.app/api/v1/info"

TEST_VIDEO = "https://x.com/i/status/2046482669286920363"

CONCURRENT_USERS = 100   # load
ROUNDS = 50             # repeat count


stats = {
    "success": 0,
    "failed": 0,
    "blocked": 0,
    "timeouts": 0
}


async def hit_api(session, user_id):
    try:
        start = time.time()

        async with session.post(API_URL, params={"url": TEST_VIDEO}, timeout=20) as res:
            text = await res.text()
            duration = round(time.time() - start, 2)

            if res.status == 200:
                stats["success"] += 1
                print(f"[OK] User {user_id} | {duration}s")

            else:
                stats["failed"] += 1
                print(f"[FAIL {res.status}] User {user_id} | {text[:80]}")

            # 🔥 BLOCK DETECTION
            if "429" in text or "rate limit" in text.lower():
                stats["blocked"] += 1
                print("🚨 RATE LIMIT DETECTED")

            if "twitter" in text.lower() and "error" in text.lower():
                stats["blocked"] += 1
                print("🚨 TWITTER BLOCK DETECTED")

    except asyncio.TimeoutError:
        stats["timeouts"] += 1
        print(f"[TIMEOUT] User {user_id}")

    except Exception as e:
        stats["failed"] += 1
        print(f"[ERROR] User {user_id}: {str(e)}")


async def run_round(round_no):
    print(f"\n🚀 ROUND {round_no} STARTED")

    async with aiohttp.ClientSession() as session:
        tasks = []

        for i in range(CONCURRENT_USERS):
            tasks.append(hit_api(session, f"{round_no}-{i}"))

        await asyncio.gather(*tasks)


async def main():
    for r in range(ROUNDS):
        await run_round(r)

        # thoda gap (natural traffic jaisa)
        await asyncio.sleep(0)

    print("\n📊 FINAL STATS:")
    print(stats)


if __name__ == "__main__":
    asyncio.run(main())