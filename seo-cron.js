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

  const prompt = `Write a professional SEO blog post for a mobile locksmith business in the Sandton area, South Africa, targeting the keyword: "${keyword}".

IMPORTANT RULES:
- This is a MOBILE locksmith service only — we come to you
- NEVER mention key cutting or key duplication — we do not offer these services
- Services we offer: emergency lockouts (car, home, office), lock changes, residential locksmith, commercial locksmith, automotive locksmith
- Do NOT include <html>, <head>, <body> tags
- Do NOT wrap content in markdown code fences like \`\`\`html
- Start directly with an <h1> tag

INTERNAL LINKS — you MUST include all of these naturally in the article:
1. Area page: <a href="${areaUrl}">${keyword}</a>
2. Emergency locksmith: <a href="${SERVICES.emergency}">emergency locksmith</a>
3. Lock change: <a href="${SERVICES.lockChange}">lock change services</a>
4. Residential: <a href="${SERVICES.residential}">residential locksmith</a>
5. Automotive: <a href="${SERVICES.automotive}">automotive locksmith</a>
6. Contact: <a href="${SERVICES.contact}">contact us</a>

Requirements:
- Length: 650-750 words
- Format: HTML (use <h1>, <h2>, <p>, <ul>, <li> tags only)
- Include the main keyword naturally 4-6 times
- Write about local areas: Sandton, Fourways, Rivonia, Midrand, Bryanston, Lonehill, Centurion
- Tone: professional, helpful, trustworthy
- Include a strong call to action at the end
- Make all internal links fit naturally into the text — do not list them, weave them in

After the HTML content add these two lines:
META_TITLE: [60 char max title including keyword]
META_DESCRIPTION: [155 char max description including keyword]`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    messages: [{ role: "user", content: prompt }],
  });

  const fullResponse = message.content[0].text;

  // Extract meta title and description
  const metaTitleMatch = fullResponse.match(/META_TITLE:\s*(.+)/);
  const metaDescMatch = fullResponse.match(/META_DESCRIPTION:\s*(.+)/);

  const metaTitle = metaTitleMatch ? metaTitleMatch[1].trim() : `${keyword} - Sandton Locksmith`;
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : `Professional mobile locksmith services for ${keyword}. Available 24/7 in Sandton and surrounding areas.`;

  // Extract just the HTML content (before META_TITLE line)
  const htmlContent = fullResponse.split(/META_TITLE:/)[0].trim();

  // Extract h1 as title
  const titleMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const title = titleMatch ? titleMatch[1] : `${keyword} - Expert Locksmith Services`;

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
