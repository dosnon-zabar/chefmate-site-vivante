"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createEvenement, updateEvenement, deleteEvenement, type EventInput } from "@/lib/api";

const TEAM_ID = process.env.CHEFMATE_TEAM_ID || "";

export type ActionState = { error?: string } | null;

function parseEventFormData(formData: FormData): Partial<EventInput> {
  const data: Partial<EventInput> = {};

  const name = formData.get("name") as string;
  if (name) data.name = name;

  const slug = formData.get("slug") as string;
  if (slug) data.slug = slug;

  const status = formData.get("status") as string;
  if (status) data.status = status as EventInput["status"];

  const description = formData.get("description") as string;
  if (description !== null) data.description = description || null;

  const presentation_text = formData.get("presentation_text") as string;
  if (presentation_text !== null) data.presentation_text = presentation_text || null;

  const report_text = formData.get("report_text") as string;
  if (report_text !== null) data.report_text = report_text || null;

  const notes = formData.get("notes") as string;
  if (notes !== null) data.notes = notes || null;

  // Dates : sérialisées en JSON
  const datesJson = formData.get("dates_json") as string;
  if (datesJson) {
    try {
      data.dates = JSON.parse(datesJson);
    } catch {
      // ignore
    }
  }

  // Note : les images sont gérées via les endpoints granulaires
  // /api/events/[id]/images, pas via le PATCH event global

  // Témoignages : sérialisés en JSON
  const testimonialsJson = formData.get("testimonials_json") as string;
  if (testimonialsJson) {
    try {
      data.testimonials = JSON.parse(testimonialsJson);
    } catch {
      // ignore
    }
  }

  return data;
}

export async function createEventAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const data = parseEventFormData(formData);

  if (!data.name?.trim()) {
    return { error: "Le titre est obligatoire" };
  }

  const result = await createEvenement(session.token, {
    ...data,
    name: data.name,
    team_id: TEAM_ID,
  });

  if (!result.success) {
    return { error: result.error };
  }

  revalidatePath("/admin/evenements");
  // Rediriger vers l'édition pour permettre l'ajout d'images
  if (result.id) {
    redirect(`/admin/evenements/${result.id}`);
  }
  redirect("/admin/evenements");
}

export async function updateEventAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const eventId = formData.get("event_id") as string;
  if (!eventId) return { error: "ID manquant" };

  const data = parseEventFormData(formData);

  const result = await updateEvenement(session.token, eventId, data);

  if (!result.success) {
    return { error: result.error };
  }

  revalidatePath("/admin/evenements");
  revalidatePath(`/admin/evenements/${eventId}`);

  // Intent : save_and_stay → rester sur la page d'édition, dans l'onglet courant
  // save_and_quit (défaut) → retour à la liste
  const intent = formData.get("intent") as string;
  if (intent === "save_and_stay") {
    const currentTab = (formData.get("current_tab") as string) || "general";
    redirect(`/admin/evenements/${eventId}?tab=${encodeURIComponent(currentTab)}&saved=1`);
  }

  redirect("/admin/evenements?saved=1");
}

export async function deleteEventAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const eventId = formData.get("event_id") as string;
  if (eventId) {
    await deleteEvenement(session.token, eventId);
  }

  revalidatePath("/admin/evenements");
  redirect("/admin/evenements");
}
