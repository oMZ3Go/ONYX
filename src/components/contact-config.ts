/** Only owner-confirmed destinations belong here. null means visibly unavailable. */
export const contact = { email: "beyond.thelimit.team@gmail.com" } as const;
export const founderLinks = {
  mz: "https://github.com/oMZ3Go",
  tala: "https://www.instagram.com/talajarkas.123/",
} as const;
export const socialLinks: Readonly<
  Record<"instagram" | "whatsapp" | "facebook" | "tiktok", string | null>
> = {
  instagram: null,
  whatsapp: null,
  facebook: null,
  tiktok: null,
};
