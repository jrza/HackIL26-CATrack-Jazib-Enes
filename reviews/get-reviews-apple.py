import requests
import json

APP_ID = "1364673170"
BASE_URL = "https://itunes.apple.com/us/rss/customerreviews"

all_low_reviews = []
page = 1

while True:
    url = f"{BASE_URL}/page={page}/id={APP_ID}/sortby=mostrecent/json"
    resp = requests.get(url)

    if resp.status_code != 200:
        print(f"Stopped: status {resp.status_code} on page {page}")
        break

    data = resp.json()
    feed = data.get("feed", {})
    entries = feed.get("entry", [])

    # If only app info is present, no more reviews
    if len(entries) <= 1:
        print("No more reviews found.")
        break

    # Reviews start from index 1
    reviews = entries[1:]

    page_low_reviews = []
    for r in reviews:
        rating = int(r["im:rating"]["label"])
        if rating <= 3:
            page_low_reviews.append({
                "author": r["author"]["name"]["label"],
                "rating": rating,
                "title": r["title"]["label"],
                "content": r["content"]["label"],
                "date": r["updated"]["label"]
            })

    if not page_low_reviews:
        print(f"No ≤3★ reviews on page {page}")
    else:
        print(f"Page {page}: found {len(page_low_reviews)} ≤3★ reviews")

    all_low_reviews.extend(page_low_reviews)
    page += 1

# Save JSON
with open("cat_inspect_low_reviews-apple.json", "w", encoding="utf-8") as f:
    json.dump(all_low_reviews, f, indent=2, ensure_ascii=False)

print(f"\nTotal low reviews (≤3★): {len(all_low_reviews)}")