from google_play_scraper import Sort, reviews_all
import json

APP_ID = "com.cat.desd.mobile.inspect"

all_reviews = reviews_all(
    APP_ID,
    sleep_milliseconds=100,
    lang="en",
    country="us",
    sort=Sort.NEWEST
)

low_reviews = [r for r in all_reviews if r['score'] <= 3]

with open("cat_inspect_low_reviews.json", "w", encoding="utf-8") as f:
    json.dump(low_reviews, f, ensure_ascii=False, indent=2, default=str)

print(f"Total reviews fetched: {len(all_reviews)}")
print(f"3-star or lower reviews: {len(low_reviews)}")