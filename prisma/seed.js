const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const slugify = (value = "") =>
  value
    .toString()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "post";

const demoContent = (heading, body) => `
  <h2>${heading}</h2>
  <p>${body}</p>
  <p>This starter template stores HTML output from TipTap so you can easily render it without extra parsing steps.</p>
`;

const seedBlogs = [
  {
    title: "Launching a Multi-tenant Content Engine",
    tags: ["Next.js", "Architecture", "Prisma"],
    coverImg: "/placeholder.svg",
    content: demoContent(
      "Scale without rebuilding",
      "This kit focuses on a reusable setup so you can clone it many times and only swap brand-specific pieces like colors, typography, and hero sections."
    ),
  },
  {
    title: "Authoring Experience with TipTap",
    tags: ["Editor", "TipTap", "Admin"],
    coverImg: "/placeholder.svg",
    content: demoContent(
      "Rich text without plugins",
      "TipTap provides a modern authoring experience with extensible toolbars, keyboard shortcuts, and clean HTML output ready for SEO-friendly rendering."
    ),
  },
  {
    title: "Improving SEO for Content-heavy Sites",
    tags: ["SEO", "Content", "Performance"],
    coverImg: "/placeholder.svg",
    content: demoContent(
      "Metadata and related posts",
      "Each blog detail page ships with dynamic metadata, structured headings, and related content suggestions to keep readers engaged."
    ),
  },
];

async function main() {
  for (const blog of seedBlogs) {
    const slug = slugify(blog.title);

    await prisma.blog.upsert({
      where: { slug },
      update: {
        ...blog,
        slug,
      },
      create: {
        ...blog,
        slug,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
