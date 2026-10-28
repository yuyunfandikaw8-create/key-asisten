"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, ImagePlus, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fieldById, type BusinessFieldId } from "@/lib/onboarding"
import {
  compressImageFile,
  createMediaId,
  createPortfolioId,
  formatPortfolioDate,
  portfolioCategoryLabel,
  type PortfolioItem,
  type PortfolioMedia,
} from "@/lib/portfolio"
import { publishFromOwner } from "@/lib/public-booking-profile"
import { cn } from "@/lib/utils"

type Draft = {
  id?: string
  title: string
  category: BusinessFieldId
  description: string
  date: string
  visible: boolean
  media: PortfolioMedia[]
}

function blankDraft(category: BusinessFieldId): Draft {
  return {
    title: "",
    category,
    description: "",
    date: String(new Date().getFullYear()),
    visible: true,
    media: [],
  }
}

export function PortfolioEditor({ className }: { className?: string }) {
  const { user, updateProfile } = useAuth()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [bio, setBio] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  const categories = useMemo(() => {
    const ids = user?.businessFields?.length
      ? user.businessFields
      : (["makeup", "hair", "dekor", "baju", "photo", "video", "content"] as BusinessFieldId[])
    return ids
      .map((id) => fieldById(id, user?.customBusinessFields))
      .filter(Boolean)
  }, [user?.businessFields, user?.customBusinessFields])

  useEffect(() => {
    if (!user) return
    setItems(user.portfolio ?? [])
    setBio(user.bio || "")
  }, [user])

  async function onMediaPick(files: FileList | null) {
    if (!files?.length || !draft) return
    setUploading(true)
    setError("")
    try {
      const next: PortfolioMedia[] = [...draft.media]
      for (const file of Array.from(files).slice(0, 6)) {
        if (file.type.startsWith("video/")) {
          if (file.size > 8_000_000) {
            setError("Video maksimal sekitar 8 MB.")
            continue
          }
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result || ""))
            reader.onerror = () => reject(new Error("Gagal baca video"))
            reader.readAsDataURL(file)
          })
          next.push({ id: createMediaId(), kind: "video", dataUrl })
          continue
        }
        if (!file.type.startsWith("image/")) {
          setError("Unggah foto (JPG/PNG/WebP) atau video.")
          continue
        }
        if (file.size > 4_000_000) {
          setError("Foto maksimal sekitar 4 MB sebelum dikompres.")
          continue
        }
        const dataUrl = await compressImageFile(file)
        next.push({ id: createMediaId(), kind: "image", dataUrl })
      }
      setDraft({ ...draft, media: next.slice(0, 12) })
    } catch {
      setError("Gagal mengunggah media.")
    } finally {
      setUploading(false)
    }
  }

  function openNew() {
    const category = (categories[0]?.id as BusinessFieldId) || "makeup"
    setDraft(blankDraft(category))
    setError("")
    setSaved(false)
  }

  function openEdit(item: PortfolioItem) {
    setDraft({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      date: item.date,
      visible: item.visible,
      media: item.media,
    })
    setError("")
    setSaved(false)
  }

  async function persist(nextItems: PortfolioItem[], nextBio = bio) {
    if (!user) return false
    setPending(true)
    setError("")
    setSaved(false)
    const updated = await updateProfile({
      bio: nextBio.trim(),
      portfolio: nextItems,
    })
    setPending(false)
    if (!updated) {
      setError("Gagal menyimpan. Coba lagi.")
      return false
    }
    publishFromOwner(updated)
    setItems(updated.portfolio ?? nextItems)
    setSaved(true)
    return true
  }

  async function saveDraft() {
    if (!draft) return
    if (!draft.title.trim()) {
      setError("Judul portofolio wajib diisi.")
      return
    }
    if (!draft.media.length) {
      setError("Unggah minimal satu foto atau video.")
      return
    }
    const nextItem: PortfolioItem = {
      id: draft.id || createPortfolioId(),
      title: draft.title.trim(),
      category: draft.category,
      description: draft.description.trim(),
      date: draft.date.trim() || String(new Date().getFullYear()),
      visible: draft.visible,
      media: draft.media,
      createdAt: items.find((item) => item.id === draft.id)?.createdAt || new Date().toISOString(),
    }
    const nextItems = draft.id
      ? items.map((item) => (item.id === draft.id ? nextItem : item))
      : [nextItem, ...items]
    const ok = await persist(nextItems)
    if (ok) setDraft(null)
  }

  async function toggleVisible(item: PortfolioItem) {
    const nextItems = items.map((entry) =>
      entry.id === item.id ? { ...entry, visible: !entry.visible } : entry
    )
    await persist(nextItems)
  }

  async function removeItem(item: PortfolioItem) {
    const nextItems = items.filter((entry) => entry.id !== item.id)
    await persist(nextItems)
    if (draft?.id === item.id) setDraft(null)
  }

  async function saveBio() {
    await persist(items, bio)
  }

  if (!user) return null

  return (
    <section className={cn("grid gap-5", className)}>
      <div className="grid gap-1.5">
        <Label htmlFor="bio-public">Tentang bisnis (profil publik)</Label>
        <Textarea
          id="bio-public"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Contoh: Makeup untuk wedding, engagement, wisuda, dan acara spesial."
          className="min-h-20"
        />
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 w-fit")}
          disabled={pending}
          onClick={() => void saveBio()}
        >
          Simpan tentang
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-medium">Portofolio</h3>
          <p className="text-sm text-muted-foreground">
            Unggah hasil pekerjaan. Atur tampil atau sembunyikan per item.
          </p>
        </div>
        <button
          type="button"
          className={cn(buttonVariants(), "h-9")}
          onClick={openNew}
        >
          <Plus className="size-4" />
          Tambah
        </button>
      </div>

      {draft ? (
        <div className="grid gap-3 rounded-xl bg-muted/30 p-4 ring-1 ring-foreground/10">
          <p className="text-sm font-medium">
            {draft.id ? "Edit portofolio" : "Portofolio baru"}
          </p>
          <div className="grid gap-1.5">
            <Label htmlFor="pf-title">Judul</Label>
            <Input
              id="pf-title"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              placeholder="Makeup Pengantin — Soft Glam"
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pf-category">Kategori</Label>
              <select
                id="pf-category"
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value as BusinessFieldId })
                }
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {categories.map((field) =>
                  field ? (
                    <option key={field.id} value={field.id}>
                      {field.emoji} {field.short}
                    </option>
                  ) : null
                )}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pf-date">Tahun / tanggal</Label>
              <Input
                id="pf-date"
                value={draft.date}
                onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                placeholder="2025 atau 2025-08"
                className="h-10"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pf-desc">Deskripsi singkat</Label>
            <Input
              id="pf-desc"
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
              placeholder="Pernikahan Yogi & Dina · Surabaya"
              className="h-10"
            />
          </div>

          <div className="grid gap-2">
            <Label>Foto / video</Label>
            <div className="flex flex-wrap gap-2">
              {draft.media.map((media) => (
                <div
                  key={media.id}
                  className="relative size-20 overflow-hidden rounded-lg ring-1 ring-foreground/10"
                >
                  {media.kind === "video" ? (
                    <video src={media.dataUrl} className="size-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.dataUrl} alt="" className="size-full object-cover" />
                  )}
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded-md bg-black/60 p-1 text-white"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        media: draft.media.filter((entry) => entry.id !== media.id),
                      })
                    }
                    aria-label="Hapus media"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-foreground/20 text-muted-foreground hover:bg-muted/40">
                <ImagePlus className="size-4" />
                <span className="text-[10px]">{uploading ? "…" : "Unggah"}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    void onMediaPick(event.target.files)
                    event.target.value = ""
                  }}
                />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.visible}
              onChange={(event) =>
                setDraft({ ...draft, visible: event.target.checked })
              }
            />
            Tampilkan di profil publik
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(buttonVariants(), "h-10")}
              disabled={pending || uploading}
              onClick={() => void saveDraft()}
            >
              {pending ? "Menyimpan…" : "Simpan item"}
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "h-10")}
              onClick={() => setDraft(null)}
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {!items.length ? (
        <p className="rounded-xl bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          Belum ada portofolio. Tambah hasil pekerjaan agar klien bisa melihat karya kamu.
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="grid gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:grid-cols-[auto_1fr]"
            >
              <div className="flex gap-1.5 overflow-x-auto">
                {item.media.slice(0, 3).map((media) => (
                  <div
                    key={media.id}
                    className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                  >
                    {media.kind === "video" ? (
                      <video src={media.dataUrl} className="size-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={media.dataUrl} alt="" className="size-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
              <div className="grid gap-2">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {portfolioCategoryLabel(item.category, user.customBusinessFields)}
                    {item.description ? ` · ${item.description}` : ""}
                    {item.date ? ` · ${formatPortfolioDate(item.date)}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.visible ? "Ditampilkan di publik" : "Disembunyikan"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
                    onClick={() => void toggleVisible(item)}
                  >
                    {item.visible ? (
                      <>
                        <EyeOff className="size-3.5" /> Sembunyikan
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" /> Tampilkan
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
                    onClick={() => void removeItem(item)}
                  >
                    <Trash2 className="size-3.5" /> Hapus
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-primary">Portofolio tersimpan & dipublikasikan.</p>
      ) : null}
    </section>
  )
}
