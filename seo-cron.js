const Anthropic = require("@anthropic-ai/sdk");
const fetch = require("node-fetch");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SUPABASE_URL = "https://vgownqjsqzdaewxidtdp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnb3ducWpzcXpkYWV3eGlkdGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTM1NDksImV4cCI6MjA5MTI2OTU0OX0.TNnX9E2_dBGzZG6gqMGKC8LgODwoL5og0pVMbq0laoo";
const WEBSITE_URL = "https://sandton-locksmith.co.za";

// Service pages
const SERVICES = {
  emergency: `${WEBSITE_URL}/services/emergency-locksmith`,
  lockChange: `${WEBSITE_URL}/services/lock-change-services`,
  residential: `${WEBSITE_URL}/services/residential-locksmith`,
  commercial: `${WEBSITE_URL}/services/commercial-locksmith`,
  automotive: `${WEBSITE_URL}/services/automotive-locksmith`,
  contact: `${WEBSITE_URL}/contact`,
};

// Weekly keyword schedule with matching area page URLs
const KEYWORDS = [
  { keyword: "sandton locksmith", areaUrl: `${WEBSITE_URL}/locksmith-sandton` },
  { keyword: "24 hour locksmiths near me", areaUrl: `${WEBSITE_URL}/locksmith-sandton` },
  { keyword: "locksmith emergency near me", areaUrl: `${WEBSITE_URL}/locksmith-sandton` },
  { keyword: "locksmith fourways", areaUrl: `${WEBSITE_URL}/locksmith-fourways` },
  { keyword: "locksmith rivonia", areaUrl: `${WEBSITE_URL}/locksmith-rivonia` },
  { keyword: "locksmith midrand", areaUrl: `${WEBSITE_URL}/locksmith-midrand` },
  { keyword: "locksmith bryanston", areaUrl: `${WEBSITE_URL}/locksmith-bryanston` },
  { keyword: "locksmiths near me", areaUrl: `${WEBSITE_URL}/locksmith-sandton` },
  { keyword: "locksmith centurion", areaUrl: `${WEBSITE_URL}/locksmith-centurion` },
  { keyword: "locksmith lonehill", areaUrl: `${WEBSITE_URL}/locksmith-lonehill` },
];

function getTodayEntry() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return KEYWORDS[dayOfYear % KEYWORDS.length];
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function generateArticle(keyword, areaUrl) {
  console.log("Generating article for keyword:", keyword);

  const prompt = `You are an expert SEO content writer specializing in local service businesses (locksmith, emergency services).

Your task is to generate a high-ranking, conversion-optimized blog article for a mobile locksmith business targeting this keyword: "${keyword}"

Website: ${WEBSITE_URL}

⚠️ CRITICAL RULES — NO EXCEPTIONS:
- This is a MOBILE locksmith service only — we come to the customer
- NEVER mention key cutting or key duplication — we do NOT offer these services
- Output must be clean HTML only — NO markdown, NO code fences, NO \`\`\`html
- Start directly with the <h1> tag — no preamble

---

## 🎯 GOAL
Create SEO-optimized blog content that:
- Ranks on Google for local keywords
- Converts visitors into calls/leads
- Builds topical authority through internal linking

---

## 📌 ARTICLE STRUCTURE (MANDATORY)

### 1. SEO TITLE (H1)
- Must include main keyword + strong intent
- Include urgency / benefit when possible
Example: "Locksmith in Lonehill – Fast Mobile Service, 24/7 Response in 15–30 Minutes"

### 2. INTRO (HOOK + PROBLEM)
- Speak directly to the user's situation (locked out, urgent need)
- Mention location naturally
- Keep it human and clear

### 3. SERVICE EXPLANATION
- Mobile locksmith concept
- Fast response
- Coverage areas (mention: Lonehill, Fourways, Rivonia, Sandton, Midrand, Bryanston, Centurion)

### 4. SERVICES SECTION (MANDATORY — use these exact H2 headings)
- Emergency Locksmith
- Residential Locksmith
- Automotive Locksmith
- Commercial Locksmith

Each section must be clear, useful, and include local keyword variations naturally.

### 5. INTERNAL LINKS (VERY IMPORTANT)
Include ALL of these links naturally woven into the text as clickable anchor text:
- <a href="${areaUrl}">${keyword}</a>
- <a href="${SERVICES.emergency}">emergency locksmith</a>
- <a href="${SERVICES.lockChange}">lock change services</a>
- <a href="${SERVICES.residential}">residential locksmith</a>
- <a href="${SERVICES.automotive}">automotive locksmith</a>
- <a href="${SERVICES.commercial}">commercial locksmith</a>
- <a href="${SERVICES.contact}">contact us</a>

### 6. LOCAL SEO EXPANSION
Mention nearby areas naturally: Lonehill, Fourways, Rivonia, Sandton, Midrand, Bryanston, Centurion

### 7. CONVERSION CTA (MANDATORY — 2 TIMES)
Mid-article: "Need a locksmith right now? We can arrive within 15–30 minutes."
End of article: "Call now for immediate assistance – fast, professional, and available 24/7."

### 8. FAQ SECTION (MANDATORY — minimum 3 questions)
Examples:
- How fast can a locksmith arrive?
- Do you offer 24/7 locksmith services?
- How much does a locksmith cost?
Keep answers short and clear.

---

## 📈 SEO RULES
- Use main keyword in title, first paragraph, and 2–3 times naturally
- Use variations: "locksmith near me", "emergency locksmith", "24 hour locksmith", "mobile locksmith"
- Avoid keyword stuffing

## 🚫 DO NOT
- Do NOT write generic content
- Do NOT skip any sections
- Do NOT write less than 800 words (target 900–1100 words)
- Do NOT forget internal links
- Do NOT forget CTA (x2)
- Do NOT forget FAQ
- Do NOT mention key cutting or key duplication

---

After the full HTML article, add these two lines:
META_TITLE: [max 60 chars, include main keyword]
META_DESCRIPTION: [max 155 chars, include main keyword, mention 24/7 and fast response]`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const fullResponse = message.content[0].text;

  // Extract meta title and description
  const metaTitleMatch = fullResponse.match(/META_TITLE:\s*(.+)/);
  const metaDescMatch = fullResponse.match(/META_DESCRIPTION:\s*(.+)/);

  const metaTitle = metaTitleMatch ? metaTitleMatch[1].trim() : `${keyword} - Sandton Locksmith`;
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : `Professional mobile locksmith for ${keyword}. Available 24/7 in Sandton and surrounding areas. Fast response in 15-30 minutes.`;

  // Extract just the HTML content (before META_TITLE line)
  const htmlContent = fullResponse.split(/META_TITLE:/)[0].trim();

  // Extract h1 as title
  const titleMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const title = titleMatch ? titleMatch[1] : `${keyword} - Expert Mobile Locksmith`;

  return {
    title,
    slug: generateSlug(title) + "-" + Date.now(),
    content: htmlContent,
    meta_description: metaDescription,
    keyword,
    published_at: new Date().toISOString(),
  };
}

async function publishArticle(article) {
  console.log("Publishing article:", article.title);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/publish-blog-post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(article),
  });

  const body = await response.text();
  console.log("Publish response:", response.status, body);

  if (!response.ok) {
    throw new Error(`Failed to publish: ${response.status} ${body}`);
  }

  return JSON.parse(body);
}

async function run() {
  console.log("🚀 SEO Cron Job starting -", new Date().toISOString());

  const { keyword, areaUrl } = getTodayEntry();
  console.log("📝 Today's keyword:", keyword);
  console.log("🔗 Area URL:", areaUrl);

  const article = await generateArticle(keyword, areaUrl);
  console.log("✅ Article generated:", article.title);

  await publishArticle(article);
  console.log("🎉 Article published successfully!");
  console.log("URL:", `${WEBSITE_URL}/blog/${article.slug}`);
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
