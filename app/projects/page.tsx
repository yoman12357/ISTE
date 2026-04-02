"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Project = {
  id: string;
  name: string;
  github: string;
  description: string;
  images: string[];
  videos: string[];
  teammateCount: number;
  teammates: string[];
  createdAt: string;
};

const PROJECT_HEAD_KEY = "iste-project-head";
const PROJECT_ROLE_KEY = "iste-user-role";
const PROJECT_HEAD_PASSCODE = process.env.NEXT_PUBLIC_PROJECT_HEAD_PASSCODE || "projecthead123";
const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "admin123";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userRole, setUserRole] = useState<"guest" | "projecthead" | "admin">(() => {
    if (typeof window === "undefined") return "guest";
    const saved = window.localStorage.getItem(PROJECT_ROLE_KEY);
    if (saved === "admin" || saved === "projecthead") return saved;
    return "guest";
  });
  const [name, setName] = useState("");
  const [github, setGithub] = useState("");
  const [description, setDescription] = useState("");
  const [teammateCount, setTeammateCount] = useState(0);
  const [teammatesRaw, setTeammatesRaw] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const [isProjectHead, setIsProjectHead] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PROJECT_HEAD_KEY) === "true";
  });
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to load projects");
        const data: Project[] = await res.json();
        setProjects(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchProjects();
  }, []);

  const handleHeadLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");

    const code = passcode.trim();
    if (code === ADMIN_PASSCODE) {
      setUserRole("admin");
      setIsProjectHead(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PROJECT_ROLE_KEY, "admin");
      }
      setPasscode("");
      return;
    }

    if (code === PROJECT_HEAD_PASSCODE) {
      setUserRole("projecthead");
      setIsProjectHead(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PROJECT_ROLE_KEY, "projecthead");
      }
      setPasscode("");
      return;
    }

    setAuthError("Invalid code. You must be an authorized project lead.");
  };

  const handleHeadLogout = () => {
    setIsProjectHead(false);
    setUserRole("guest");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROJECT_ROLE_KEY, "guest");
    }
  };

  const allowAnyFilesToBase64 = async (files: FileList | null) => {
    if (!files) return [] as string[];

    return Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") resolve(reader.result);
              else reject(new Error("Unable to convert file."));
            };
            reader.onerror = () => reject(new Error("Unable to read file."));
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    try {
      const newImages = await allowAnyFilesToBase64(event.target.files);
      setImagePreviews((prev) => [...prev, ...newImages]);
      event.target.value = "";
    } catch {
      setError("Could not load selected images.");
    }
  };

  const handleVideoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    try {
      const newVideos = await allowAnyFilesToBase64(event.target.files);
      setVideoPreviews((prev) => [...prev, ...newVideos]);
      event.target.value = "";
    } catch {
      setError("Could not load selected videos.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter the project title.");
      return;
    }

    if (!github.trim()) {
      setError("Please enter the project link.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a project description.");
      return;
    }

    const teammates = teammatesRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (teammateCount > 0 && teammates.length !== teammateCount) {
      setError("Team size must match the number of teammate names provided.");
      return;
    }

    const payload = {
      name: name.trim(),
      github: github.trim(),
      description: description.trim(),
      images: imagePreviews,
      videos: videoPreviews,
      teammateCount: Number(teammateCount) || teammates.length,
      teammates,
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add project");
      }

      const created = await res.json();
      setProjects((current) => [created, ...current]);
      setName("");
      setGithub("");
      setDescription("");
      setTeammateCount(0);
      setTeammatesRaw("");
      setImagePreviews([]);
      setVideoPreviews([]);
    } catch (err: any) {
      setError(err.message || "Could not add project.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-role": userRole },
      });
      if (!res.ok) {
        throw new Error("Could not delete project");
      }
      setProjects((current) => current.filter((project) => project.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete project. Please contact admin.");
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 md:px-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-primary mb-6">Project Showcase</h1>

        <div className="mb-4 flex justify-end">
          {!isProjectHead ? (
            <button
              onClick={() => setShowLoginPanel((s) => !s)}
              className="rounded-lg border border-white/25 bg-primary px-4 py-2 text-sm font-semibold text-black hover:brightness-110"
            >
              {showLoginPanel ? "Cancel" : "Project Head Add"}
            </button>
          ) : (
            <button type="button" onClick={handleHeadLogout} className="rounded-lg border border-white/25 bg-red-500/80 px-4 py-2 text-sm font-semibold">Logout</button>
          )}
        </div>

        {!isProjectHead && showLoginPanel && (
          <form onSubmit={handleHeadLogin} className="mb-10 rounded-xl border border-white/20 bg-black/30 p-6 shadow-lg">
            <p className="text-sm text-muted-foreground">Authorized project leads can add new projects, but everyone can view all the work.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold mb-1">Project Head Passcode</label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full rounded-lg border border-white/25 bg-white/5 px-3 py-2 outline-none focus:border-primary"
                  placeholder="Enter passcode"
                />
              </div>
            </div>
            {authError && <p className="mt-3 text-sm text-red-400">{authError}</p>}
            <button type="submit" className="mt-6 rounded-lg bg-primary px-5 py-2 font-semibold text-black hover:brightness-110">Login as Project Head</button>
          </form>
        )}

        {isProjectHead && (
          <form onSubmit={handleSubmit} className="mb-10 rounded-xl border border-white/20 bg-black/30 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">Add a project; it is persisted in your browser via localStorage.</p>
              <button type="button" onClick={handleHeadLogout} className="rounded-lg border border-white/25 bg-red-500/80 px-3 py-1 text-sm">Logout</button>
            </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-1">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/25 bg-white/5 px-3 py-2 outline-none focus:border-primary"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Number of teammates</label>
              <input
                type="number"
                min={0}
                value={teammateCount}
                onChange={(e) => setTeammateCount(Number(e.target.value))}
                className="w-full rounded-lg border border-white/25 bg-white/5 px-3 py-2 outline-none focus:border-primary"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Team member names (comma-separated)</label>
              <input
                type="text"
                value={teammatesRaw}
                onChange={(e) => setTeammatesRaw(e.target.value)}
                className="w-full rounded-lg border border-white/25 bg-white/5 px-3 py-2 outline-none focus:border-primary"
                placeholder="Alice, Bob, Charlie"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">GitHub Link</label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full rounded-lg border border-white/25 bg-white/5 px-3 py-2 outline-none focus:border-primary"
                placeholder="https://github.com/your-org/your-repo"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-white/25 bg-white/5 px-3 py-2 outline-none focus:border-primary"
                placeholder="Write a short description of the project"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Project Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="w-full rounded-lg border border-white/25 bg-white/5 px-3 py-2"
              />

              {imagePreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {imagePreviews.map((src, index) => (
                    <div key={`${src}-${index}`} className="relative">
                      <img src={src} alt={`selected-${index}`} className="h-20 w-full object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => setImagePreviews((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 rounded-full bg-red-500/90 text-white p-1 text-xs"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Project Videos</label>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
                className="w-full rounded-lg border border-white/25 bg-white/5 px-3 py-2"
              />

              {videoPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {videoPreviews.map((src, index) => (
                    <div key={`${src}-${index}`} className="relative">
                      <video controls className="h-40 w-full rounded-md object-cover">
                        <source src={src} type="video/mp4" />
                        Your browser does not support video playback.
                      </video>
                      <button
                        type="button"
                        onClick={() => setVideoPreviews((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 rounded-full bg-red-500/90 text-white p-1 text-xs"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            className="mt-6 rounded-lg bg-primary px-5 py-2 font-semibold text-black hover:brightness-110"
          >
            Add Project
          </button>
        </form>
        )}

        <section>
          <h2 className="text-3xl font-semibold mb-4">Saved Projects</h2>

          {projects.length === 0 ? (
            <p className="text-muted-foreground">No projects yet. Add one through the form above.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {projects.map((project) => (
                <article key={project.id} className="rounded-xl border border-white/15 bg-black/30 p-4 shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{project.name}</h3>
                      <a href={project.github} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                        {project.github}
                      </a>
                    </div>
                    {isProjectHead && (
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="rounded-md px-2 py-1 text-sm bg-red-500/80 hover:bg-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">{project.description}</p>

                  {project.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {project.images.map((src, idx) => (
                        <img key={`${project.id}-${idx}`} src={src} alt={`${project.name}-${idx}`} className="h-28 w-full rounded-md object-cover" />
                      ))}
                    </div>
                  )}

                  <p className="mt-3 text-xs text-muted-foreground">Saved {new Date(project.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
