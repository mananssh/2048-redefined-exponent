"use client";

import dynamic from 'next/dynamic';
import GeneratePage from '@/components/AgenticAI';

const ClientGame = dynamic(() => import('@/components/ClientGame'), { ssr: false });

export default function Page() {
  return <ClientGame />;
}
