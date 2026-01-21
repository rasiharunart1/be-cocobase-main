import type { Metadata } from 'next';
import { poppins } from '@/app/ui/fonts';
import '../globals.css';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '@/app/ui/navbar';
import Head from 'next/head';

export const metadata: Metadata = {
  title: {
    template: '%s | Cocobase',
    default: 'Cocobase',
  },
  description: 'Cocobase',
  metadataBase: new URL('https://cocobase-beta.vercel.app/'),
  openGraph: {
    title: 'Cocobase',
    description: 'Cocobase adalah platform gula kelapa gula aren yang berkualitas',
    url: 'https://cocobase-beta.vercel.app/',
    siteName: 'Cocobase',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cocobase',
    description: 'Cocobase adalah platform gula kelapa gula aren yang berkualitas',
    images: [
      {
        url: 'https://cocobase-beta.vercel.app/home.png',
        width: 500,
        height: 500,
        alt: 'Cocobase',  
      },
    ],

  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Head>
        <link rel="sitemap" href="/sitemap.xml" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google" content="notranslate" />
        <link rel="canonical" href="https://cocobase-beta.vercel.app/" />
        <meta name="author" content="Cocobase" />
        <title>Cocobase</title>
        <meta name="description" content="Cocobase adalah platform gula kelapa gula aren yang berkualitas" />
        <meta name="keywords" content="Cocobase, gula kelapa, gula aren, gula kelapa aren, kelapa, cilongok, gula kelapa cilongok" />
        <meta name="author" content="Cocobase" />
        <meta property="og:title" content="Cocobase" />
        <meta property="og:description" content="Cocobase adalah platform gula kelapa gula aren yang berkualitas" />
        <meta property="og:url" content="https://cocobase-beta.vercel.app/" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Cocobase",
              "url": "https://cocobase-beta.vercel.app/"
            }
          `}
        </script>
      </Head>


      <body className={`${poppins.className} bg-white text-[#202224] scroll-smooth`}>
        <Navbar />
        <div className="relative md:top-[48px] bottom-[48px] md:bottom-0">

          {children}
        </div>
      </body>
    </html>
  )
}
