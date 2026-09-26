import './style.css';
import type { Metadata } from 'next';
export const metadata:Metadata={title:'Quail Valley Jewelers | Missouri City, TX',description:'Family owned fine jewelry, custom designs, and expert jewelry and watch repair in Missouri City, Texas.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
