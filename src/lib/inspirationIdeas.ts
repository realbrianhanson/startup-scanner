import { Building2, ShoppingCart, MapPin, HeartPulse } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface InspirationIdea {
  name: string;
  industry: string;
  icon: LucideIcon;
  description: string;
  targetMarket: string;
  competitors: string;
  businessModel: string;
}

export const INSPIRATION_IDEAS: InspirationIdea[] = [
  {
    name: "NutriPlan AI",
    industry: "Healthcare",
    icon: HeartPulse,
    description: "An AI-powered meal planning app for busy parents that generates personalized weekly meal plans based on dietary needs, allergies, budget, and prep time. Includes auto-generated grocery lists, recipe instructions, and nutritional tracking. Integrates with grocery delivery services for one-tap ordering.",
    targetMarket: "Busy parents aged 28-45 with children, dual-income households, health-conscious families",
    competitors: "Mealime, Eat This Much, PlateJoy",
    businessModel: "Freemium",
  },
  {
    name: "InvoiceFlow",
    industry: "B2B SaaS",
    icon: Building2,
    description: "A freelancer invoice automation tool that auto-generates invoices from project tracking data, sends payment reminders, handles multi-currency billing, and provides tax-ready financial summaries. Features smart payment detection from bank feeds and integrates with popular freelance platforms.",
    targetMarket: "Freelancers, independent contractors, small agencies with 1-10 employees",
    competitors: "FreshBooks, Wave, Bonsai",
    businessModel: "Subscription",
  },
  {
    name: "ThreadEarth",
    industry: "E-commerce",
    icon: ShoppingCart,
    description: "A sustainable fashion marketplace connecting eco-conscious consumers with verified sustainable clothing brands. Features a sustainability score for each product, carbon footprint tracking per purchase, clothing swap/resale section, and a rewards program for sustainable shopping habits.",
    targetMarket: "Environmentally conscious consumers aged 22-40, primarily urban millennials and Gen-Z",
    competitors: "ThredUp, Poshmark, Depop",
    businessModel: "Marketplace",
  },
  {
    name: "FixItLocal",
    industry: "Local Services",
    icon: MapPin,
    description: "A local home services booking platform that connects homeowners with vetted, insured contractors for plumbing, electrical, cleaning, and handyman services. Features real-time availability, transparent pricing, in-app messaging, and a review system with photo proof of completed work.",
    targetMarket: "Homeowners and renters aged 30-60 in suburban and urban areas",
    competitors: "Thumbtack, Angi, TaskRabbit",
    businessModel: "Marketplace",
  },
];
