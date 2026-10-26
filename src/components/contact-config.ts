/** Only owner-confirmed destinations belong here. null means visibly unavailable. */
export const contact = { email: "beyond.thelimit.team@gmail.com" } as const;
export const socialLinks: Readonly<
  Record<"instagram" | "whatsapp" | "facebook" | "tiktok", string | null>
> = {
  instagram: null,
  whatsapp: null,
  facebook: null,
  tiktok: null,
};
