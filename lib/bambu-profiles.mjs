// Populated only by the pinned upstream loader, or transferred to an export worker.
const profiles=Object.create(null);
export default profiles;
export const profileModels={h3c:['H3C','H3C'],x1c:['X1 Carbon','X1C'],h2c:['H2C','H2C'],h2d:['H2D','H2D'],h2dpro:['H2D Pro','H2DP'],h2s:['H2S','H2S'],x2d:['X2D','X2D'],x1e:['X1E','X1E'],x1:['X1','X1'],p2s:['P2S','P2S'],p1s:['P1S','P1S'],p1p:['P1P','P1P'],a2l:['A2L','A2L'],a1:['A1','A1'],a1mini:['A1 mini','A1M']};
export const isBambuPrinter=key=>Object.hasOwn(profileModels,key);
