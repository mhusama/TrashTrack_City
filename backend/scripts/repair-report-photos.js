/**
 * @deprecated Do not use — copies random uploads including NID images into report slots.
 * Use fix-report-photo-urls.js instead. Kept as no-op with warning.
 */
console.error(
  "repair-report-photos is disabled. Report photos must be uploaded with each report; NID images must not be used."
);
process.exit(1);
