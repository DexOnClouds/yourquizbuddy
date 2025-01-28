'use client';

import React from 'react';
import { Button } from "@/components/ui/button";

export default function ThemePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-renogare mb-8 text-primary">Theme Showcase</h1>
        
        {/* Typography */}
        <section className="mb-12 bg-card p-6 rounded-lg">
          <h2 className="text-2xl font-renogare mb-4 text-secondary">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-renogare">Heading 1 with Renogare</h1>
            <h2 className="text-3xl font-renogare">Heading 2 with Renogare</h2>
            <h3 className="text-2xl font-renogare">Heading 3 with Renogare</h3>
            <p className="text-lg font-ttdrugs">Body text with TT Drugs</p>
            <p className="text-muted font-ttdrugs">Muted text with TT Drugs</p>
          </div>
        </section>

        {/* Colors */}
        <section className="mb-12 bg-card p-6 rounded-lg">
          <h2 className="text-2xl font-renogare mb-4 text-secondary">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary rounded-lg">
              <p className="font-renogare text-primary-foreground">Primary</p>
              <p className="text-sm font-ttdrugs text-primary-foreground/80">#ff6b9d</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="font-renogare text-secondary-foreground">Secondary</p>
              <p className="text-sm font-ttdrugs text-secondary-foreground/80">#b86ef8</p>
            </div>
            <div className="p-4 bg-accent rounded-lg">
              <p className="font-renogare text-accent-foreground">Accent</p>
              <p className="text-sm font-ttdrugs text-accent-foreground/80">#ff9cc7</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-muted/20">
              <p className="font-renogare text-foreground">Background</p>
              <p className="text-sm font-ttdrugs text-foreground/80">#1a1625</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-muted/20">
              <p className="font-renogare text-card-foreground">Card</p>
              <p className="text-sm font-ttdrugs text-card-foreground/80">#241b2f</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-renogare text-muted-foreground">Muted</p>
              <p className="text-sm font-ttdrugs text-muted-foreground/80">#9c8aa5</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12 bg-card p-6 rounded-lg">
          <h2 className="text-2xl font-renogare mb-4 text-secondary">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
              Primary Button
            </Button>
            <Button className="bg-secondary hover:bg-secondary-hover text-secondary-foreground">
              Secondary Button
            </Button>
            <Button className="bg-accent hover:bg-accent-hover text-accent-foreground">
              Accent Button
            </Button>
            <Button className="bg-muted hover:bg-muted-hover text-muted-foreground">
              Muted Button
            </Button>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-renogare mb-4 text-secondary">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card hover:bg-card-hover p-6 rounded-lg transition-colors duration-200">
              <h3 className="text-xl font-renogare text-primary mb-2">Card Title</h3>
              <p className="font-ttdrugs text-card-foreground/80 mb-4">
                This is a sample card with our theme colors. It uses the card background color and has a subtle hover effect.
              </p>
              <Button className="bg-accent hover:bg-accent-hover text-accent-foreground">
                Learn More
              </Button>
            </div>
            <div className="bg-card hover:bg-card-hover p-6 rounded-lg transition-colors duration-200">
              <h3 className="text-xl font-renogare text-secondary mb-2">Another Card</h3>
              <p className="font-ttdrugs text-card-foreground/80 mb-4">
                Here's another card showcasing our romantic theme. Notice how the colors work together to create a cohesive look.
              </p>
              <Button className="bg-secondary hover:bg-secondary-hover text-secondary-foreground">
                Explore
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
