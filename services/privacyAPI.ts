export const privacyAPI = {
  async anonymizeCrop(_clipId: string): Promise<{ faces: number; plates: number }> {
    await new Promise((r) => setTimeout(r, 220));
    return { faces: 1, plates: 1 };
  },
};
