import urllib.request
import re
import sys

def get_ig_img(url, default=''):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        m = re.search(r'"og:image" content="([^"]+)"', html)
        if m:
            return m.group(1).replace('&amp;', '&')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
    return default

if __name__ == "__main__":
    urls = [
        "https://www.instagram.com/p/Cg3ranmDnVq/",
        "https://www.instagram.com/p/Cgy6kJeDeJJ/",
        "https://www.instagram.com/reel/CvmvNCItjLy/"
    ]
    for url in urls:
        img_url = get_ig_img(url)
        print(f"URL: {url}\nIMG: {img_url}\n")
