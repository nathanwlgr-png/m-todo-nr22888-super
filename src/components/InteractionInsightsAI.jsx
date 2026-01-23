import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientSentimentAnalyzer from './ClientSentimentAnalyzer';
import AutoInteractionTagger from './AutoInteractionTagger';

export default function InteractionInsightsAI({ clientId, interactions = [] }) {
    return (
        <div className="space-y-4">
            <Tabs defaultValue="sentiment" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sentiment">Análise Sentimento</TabsTrigger>
                    <TabsTrigger value="tagging">Auto-Categorização</TabsTrigger>
                </TabsList>

                <TabsContent value="sentiment" className="mt-4">
                    <ClientSentimentAnalyzer 
                        clientId={clientId} 
                        interactions={interactions} 
                    />
                </TabsContent>

                <TabsContent value="tagging" className="mt-4">
                    <AutoInteractionTagger 
                        clientId={clientId} 
                        interactions={interactions} 
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}