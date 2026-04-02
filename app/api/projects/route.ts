import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const DATA_DIR = path.join(process.cwd(), "ISTE", "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DATABASE_PATH = path.join(DATA_DIR, "projects.db");

const db = new Database(DATABASE_PATH);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    github TEXT NOT NULL,
    description TEXT NOT NULL,
    images TEXT NOT NULL,
    videos TEXT NOT NULL,
    teammateCount INTEGER NOT NULL,
    teammates TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

const allowedRoles = new Set(["projecthead", "admin"]);

function validateAuth(request: Request) {
  const role = request.headers.get("x-user-role") || "";
  return allowedRoles.has(role);
}

export async function GET() {
  const rows = db.prepare("SELECT * FROM projects ORDER BY createdAt DESC").all();
  const projects = rows.map((row: any) => ({
    ...row,
    images: JSON.parse(row.images),
    videos: JSON.parse(row.videos),
    teammates: JSON.parse(row.teammates),
    teammateCount: Number(row.teammateCount),
  }));
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  if (!validateAuth(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const { name, github, description, images, videos, teammateCount, teammates } = body as any;

  if (!name || !github || !description) {
    return NextResponse.json({ message: "Name, GitHub link and description are required." }, { status: 400 });
  }

  if (!Array.isArray(images) || !Array.isArray(videos)) {
    return NextResponse.json({ message: "Images and videos should be arrays." }, { status: 400 });
  }

  const parsedTeammates = Array.isArray(teammates)
    ? teammates.filter((t) => typeof t === "string" && t.trim().length > 0)
    : [];

  if (Number(teammateCount) > 0 && parsedTeammates.length !== Number(teammateCount)) {
    return NextResponse.json({ message: "Teammate count must match number of names provided." }, { status: 400 });
  }

  const project = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(name),
    github: String(github),
    description: String(description),
    images: JSON.stringify(images.slice(0, 50)),
    videos: JSON.stringify(videos.slice(0, 50)),
    teammateCount: Number(teammateCount) || parsedTeammates.length,
    teammates: JSON.stringify(parsedTeammates),
    createdAt: new Date().toISOString(),
  };

  const stmt = db.prepare(`
    INSERT INTO projects (id, name, github, description, images, videos, teammateCount, teammates, createdAt)
    VALUES (@id, @name, @github, @description, @images, @videos, @teammateCount, @teammates, @createdAt)
  `);
  stmt.run(project);

  return NextResponse.json({ ...project, images: JSON.parse(project.images), videos: JSON.parse(project.videos), teammates: JSON.parse(project.teammates) });
}

export async function DELETE(request: Request) {
  if (!validateAuth(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Project id required." }, { status: 400 });
  }

  const deleteStmt = db.prepare("DELETE FROM projects WHERE id = ?");
  deleteStmt.run(id);

  return NextResponse.json({ success: true });
}