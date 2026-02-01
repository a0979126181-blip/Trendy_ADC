import os
import time
import argparse
import smtplib
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from datetime import datetime
from typing import List, Dict

# Third-party libraries
import google.generativeai as genai
from playwright.sync_api import sync_playwright

# --- Configuration ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GMAIL_USER = os.environ.get("GMAIL_USER")
# NOTE: For Gmail, you MUST use an 'App Password' if 2FA is enabled. 
# Go to Google Account > Security > 2-Step Verification > App passwords.
GMAIL_PASSWORD = os.environ.get("GMAIL_PASSWORD") 
RECIPIENT_EMAIL = os.environ.get("RECIPIENT_EMAIL", GMAIL_USER)

# --- Strategy Definitions ---
def get_strategy(tab_name: str) -> Dict:
    strategies = {
        'CMF': {
            'keywords': [
                "innovative materials consumer electronics 2025",
                "new surface finishing trends tech",
                "sustainable CMF design",
                "eco-friendly electronic materials"
            ],
            'criteria': "專注於材質創新、塗層工藝、觸感或色彩趨勢。忽略純硬體規格升級。"
        },
        'ID': {
            'keywords': [
                "consumer electronics industrial design trends",
                "new form factor smartphones",
                "minimalist hardware aesthetics",
                "ergonomic electronics design"
            ],
            'criteria': "專注於造型語彙、人體工學、使用者互動介面。尋找獨特的設計案例。"
        },
        'TOOLING': {
            'keywords': [
                "injection molding innovation electronics",
                "CNC machining techniques for prototypes",
                "new manufacturing process tech",
                "additive manufacturing electronics"
            ],
            'criteria': "專注於生產製程、量產工藝解決方案或原型製作技術。"
        }
    }
    return strategies.get(tab_name, {
        'keywords': [f"{tab_name} latest trends technology"],
        'criteria': "尋找與該主題最相關的最新技術進展。"
    })

# --- Helper: Validate URL ---
def is_url_valid(url: str) -> bool:
    """
    Simple check to see if URL is reachable before launching full browser.
    """
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        # Accept 200-299 standard success, and 403 (sometimes blocked by bot protection but link exists)
        # We reject 404 strictly.
        if response.status_code == 404:
            return False
        return True
    except:
        # If HEAD fails, we'll let Playwright try it, 
        # but assume valid for now to avoid false negatives on strict firewalls.
        return True

# --- Step B: AI Deep Research ---
def perform_deep_research(tab_name: str, strategy: Dict) -> List[Dict]:
    print(f"[*] Starting Deep Research for: {tab_name}...")
    
    if not GEMINI_API_KEY:
        print("[!] Error: GEMINI_API_KEY is missing.")
        return []

    genai.configure(api_key=GEMINI_API_KEY)
    
    tools = 'google_search_retrieval'
    model = genai.GenerativeModel('gemini-1.5-pro', tools=tools)
    
    keywords_str = ", ".join(strategy['keywords'])
    
    prompt = f"""
    You are a professional trend researcher.
    Target Tab: {tab_name}
    Keywords: {keywords_str}
    
    Filter Criteria: {strategy['criteria']}
    
    Task:
    1. Search for the latest articles (published in the last 12 months).
    2. Select exactly 3 high-quality URLs. 
    3. CRITICAL: Do not invent URLs. Only use URLs provided by the Google Search tool.
    4. For each URL, write a concise summary in Traditional Chinese (繁體中文).
    
    Output Format (JSON List):
    [
      {{
        "url": "https://...",
        "title": "Article Title",
        "summary": "Traditional Chinese summary here..."
      }}
    ]
    Return ONLY valid JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        
        import json
        raw_results = json.loads(text)
        print(f"[*] AI found {len(raw_results)} candidates. Validating links...")
        
        valid_results = []
        for res in raw_results:
            url = res.get('url')
            if url and is_url_valid(url):
                valid_results.append(res)
            else:
                print(f"    [x] Skipped invalid link: {url}")
                
        print(f"[*] Final valid articles: {len(valid_results)}")
        return valid_results
    except Exception as e:
        print(f"[!] AI Research failed: {e}")
        return []

# --- Step C: Screenshot via Playwright ---
def capture_screenshots(articles: List[Dict]):
    print("[*] Starting Screenshot capture...")
    
    # Filter list to store only successfully processed articles
    successful_articles = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a real user agent to avoid being blocked by some sites
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        for i, article in enumerate(articles):
            url = article.get('url')
            filename = f"screenshot_{i}.png"
            
            print(f"    Processing [{i+1}/{len(articles)}]: {url}")
            try:
                page = context.new_page()
                # Set a strict timeout. If it hangs, we skip it.
                page.set_default_timeout(20000) 
                
                response = page.goto(url, wait_until='domcontentloaded')
                
                if response and response.status == 404:
                    print(f"    [!] Page returned 404. Removing from report.")
                    page.close()
                    continue

                time.sleep(3) # Wait for images/lazy-load
                
                page.screenshot(path=filename)
                print(f"    -> Saved: {filename}")
                
                article['screenshot_path'] = filename
                successful_articles.append(article)
                page.close()
            except Exception as e:
                print(f"    [!] Failed to load/screenshot {url}: {e}")
                # If we can't load it, we probably shouldn't email it as a "valid link"
                # But if you want to keep the link even without screenshot, uncomment line below:
                # successful_articles.append(article) 
                
        browser.close()
    
    # Update the main list to only include successful ones
    articles[:] = successful_articles

# --- Step D: Send Email ---
def send_email_report(subject_prefix: str, content_html: str, images: List[str] = [], recipient: str = RECIPIENT_EMAIL):
    """
    Generic email sender
    """
    if not GMAIL_USER or not GMAIL_PASSWORD:
        print("[!] Error: GMAIL_USER or GMAIL_PASSWORD env vars are missing.")
        print("    Note: Use an 'App Password', not your login password.")
        return

    msg = MIMEMultipart('related')
    msg['Subject'] = f"{subject_prefix} {datetime.now().strftime('%Y-%m-%d')}"
    msg['From'] = GMAIL_USER
    msg['To'] = recipient

    msg.attach(MIMEText(content_html, 'html'))

    # Attach images
    for i, img_path in enumerate(images):
        if img_path and os.path.exists(img_path):
            with open(img_path, 'rb') as f:
                img_data = f.read()
                image = MIMEImage(img_data, name=os.path.basename(img_path))
                image.add_header('Content-ID', f'<image_{i}>')
                msg.attach(image)

    try:
        print(f"[*] Connecting to SMTP (smtp.gmail.com:465)...")
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[*] Email sent successfully to {recipient}!")
    except smtplib.SMTPAuthenticationError:
        print("[!] Authentication Failed.")
        print("    1. Check your email/password.")
        print("    2. Ensure you are using an **App Password** (Google Account > Security > 2-Step Verification > App passwords).")
    except Exception as e:
        print(f"[!] Failed to send email: {e}")

# --- Test Mode ---
def run_test_email():
    print("==========================================")
    print("TEST MODE: Sending verification email...")
    print("==========================================")
    
    html = """
    <html>
        <body>
            <h2 style="color: green;">Test Email Successful</h2>
            <p>If you are reading this, your Python script is correctly configured to send emails.</p>
            <p>Timestamp: {}</p>
        </body>
    </html>
    """.format(datetime.now())
    
    send_email_report("[TEST]", html)

# --- Main Entry Point ---
def run_daily_report(tab_name: str):
    print("==========================================")
    print(f"Starting Daily Trend Reporter: {tab_name}")
    print("==========================================")
    
    # A. Get Strategy
    strategy = get_strategy(tab_name)
    
    # B. Deep Research
    articles = perform_deep_research(tab_name, strategy)
    
    if not articles:
        print("[!] Aborting: No valid articles found after validation.")
        return

    # C. Screenshots (also acts as final link validation)
    capture_screenshots(articles)
    
    if not articles:
        print("[!] Aborting: All articles failed to load during screenshot phase.")
        return
    
    # D. Build Email HTML
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2c3e50;">{tab_name} Trend Report</h2>
        <p style="color: #666; font-size: 12px;">Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
        <hr>
    """
    
    valid_images = []
    for i, article in enumerate(articles):
        idx = i + 1
        html_content += f"""
        <div style="margin-bottom: 40px; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h3 style="color: #2980b9;">CASE {idx}: {article.get('title')}</h3>
            <p style="font-size: 14px; line-height: 1.6; background-color: #f9f9f9; padding: 10px;">
                <strong>重點總結：</strong><br>{article.get('summary')}
            </p>
            <p><a href="{article.get('url')}" style="display:inline-block; background:#e74c3c; color:white; padding:8px 12px; text-decoration:none; border-radius:4px;">閱讀原文 &rarr;</a></p>
        """
        
        if article.get('screenshot_path'):
            html_content += f"""
            <div style="margin-top: 15px;">
                <a href="{article.get('url')}"><img src="cid:image_{i}" style="width: 100%; max-width: 600px; border: 1px solid #ddd;"></a>
            </div>
            """
            valid_images.append(article.get('screenshot_path'))
        
        html_content += "</div>"
    
    html_content += "</body></html>"
    
    # E. Send
    send_email_report(f"[{tab_name} Trend]", html_content, valid_images)

    # Cleanup
    print("[*] Cleaning up temporary screenshots...")
    for img in valid_images:
        try:
            os.remove(img)
        except:
            pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TrendPulse Reporter Script")
    parser.add_argument('topic', nargs='?', default='CMF', help="Topic to research (e.g., ID, CMF)")
    parser.add_argument('--test-email', action='store_true', help="Send a test email to verify credentials without researching")
    
    args = parser.parse_args()
    
    if args.test_email:
        run_test_email()
    else:
        run_daily_report(args.topic)
