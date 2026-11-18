export const APP_VERSION='1.2.0';
export const TERMS_VERSION='2026-11-17.1';
export const termsSections=[
 ['Free personal use','You may use Skadis Canvas to create files and prints for your own noncommercial projects, including gifts that are not sold.'],
 ['Commercial use','Selling generated STL or 3MF files, selling printed objects made from them, or using the service for commercial production requires separate written commercial-use permission from the Skadis Canvas operator. Paid commercial plans are not available yet. A donation does not grant commercial permission. These service conditions apply to exports made after acceptance; they do not retroactively change earlier permissions.'],
 ['Your artwork and other rights','You retain rights in your uploaded artwork and your original contributions. You must have permission to reproduce and use that artwork. Skadis Canvas retains rights it actually owns in its software and original protectable designs; generating a file does not transfer ownership of your artwork or automatically create copyright in functional geometry. Commercial permission from Skadis Canvas does not grant rights in third-party artwork, trademarks or designs. Third-party and open-source materials remain subject to their own licenses; these service conditions do not restrict rights granted by those licenses.'],
 ['Export identification','Exports contain an opaque random export ID, the terms version and an acceptance timestamp. Tiles also include a small recessed rear code and an enclosed internal pattern. These identify an export, not a person, and contain no name or email address. They can be removed or altered and are not proof of ownership or a guaranteed way to identify a print.'],
 ['Local processing and printer settings','Artwork and model generation stay in your browser. Bambu printer settings are requested from the public Bambu Studio repository on GitHub and cached locally when possible. GitHub receives the network information needed to serve those requests; uploaded artwork is not sent with them. Acceptance is recorded for this browser session and in exported metadata, not in an authenticated account or payment record.'],
 ['Before printing','Check the exported geometry, material assignments, sliced layers and mounting method. Print a test tile and check its fit and strength before making a wall. Internal identifiers create small cavities; no load rating or physical-print validation is provided by the service.']
];
export const termsText=()=>`Skadis Canvas — Service terms ${TERMS_VERSION}\n\n`+termsSections.map(([heading,body])=>`${heading}\n${body}`).join('\n\n');
export function createProvenance(acceptedAt){
 if(!acceptedAt||!Number.isFinite(Date.parse(acceptedAt)))throw Error('Accept the current service terms before exporting.');
 const bytes=crypto.getRandomValues(new Uint8Array(8));
 return {schema:1,appVersion:APP_VERSION,exportId:Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''),termsVersion:TERMS_VERSION,acceptedAt,createdAt:new Date().toISOString(),permission:'personal-noncommercial',identity:'random export identifier; no personal information'};
}
