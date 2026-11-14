import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Skadis Canvas',description:'Design a modular pegboard mural with your own illustration and export multicolor tiles.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
