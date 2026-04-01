import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Building, Users, Zap } from 'lucide-react';
import { Seo } from '../components/Seo';

const missionPoints = [
  'Help contractors and dealers sell faster.',
  'Help buyers find exactly what they need.',
  'Keep the process straightforward, responsive, and built around real industry needs.',
];

const audiences = [
  {
    title: 'Loggers & Contractors',
    description: 'Whether you are moving one machine or a full fleet, we make it easier to reach serious buyers.',
    icon: Users,
  },
  {
    title: 'Equipment Dealers',
    description: 'Dealer tools, featured placement, and scalable inventory support help established sellers move iron consistently.',
    icon: Building,
  },
  {
    title: 'Buyers',
    description: 'From owner-operators to larger operations, buyers get better search tools, financing access, and clearer equipment discovery.',
    icon: Award,
  },
];

export function About() {
  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="About Us | Forestry Equipment Sales"
        description="Learn why Forestry Equipment Sales was built, who we serve, and how our marketplace helps contractors, dealers, and buyers move equipment faster."
        canonicalPath="/about"
      />

      <section className="relative overflow-hidden border-b border-line bg-surface px-4 py-24 md:px-8 md:py-28">
        <div className="absolute right-0 top-0 h-full w-1/3 translate-x-1/2 skew-x-12 bg-accent/10" />
        <div className="relative z-10 mx-auto max-w-[1600px]">
          <div className="mb-6 flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-ink">
              <Building className="text-accent" size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">About Forestry Equipment Sales</span>
          </div>
          <h1 className="mb-8 text-5xl font-black uppercase tracking-tighter leading-none md:text-7xl">
            Built For The
            <br />
            <span className="text-muted">Forestry Equipment Trade</span>
          </h1>
          <p className="max-w-3xl text-base font-medium leading-relaxed text-muted md:text-lg">
            Our platform was built from the ground up by people who have been in the woods, walked the job sites,
            and marketed machines for over two decades. Forestry Equipment Sales is a modern marketplace designed
            specifically for buying and selling forestry equipment.
          </p>
        </div>
      </section>

      <section className="bg-bg px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-line bg-surface p-8 md:p-12">
            <span className="label-micro mb-4 block text-accent">Why We Exist</span>
            <h2 className="mb-6 text-3xl font-black uppercase tracking-tighter md:text-5xl">
              A Better Marketplace
              <br />
              <span className="text-muted">For Real Equipment Sellers</span>
            </h2>
            <div className="space-y-5 text-sm font-medium leading-relaxed text-muted md:text-base">
              <p>
                The big listing sites have become overpriced and dated. We saw a gap: private sellers and dealers
                needed a platform that works as hard as they do without corporate-level fees or bloated workflows.
              </p>
              <p>
                Whether you are an owner-operator, a contractor, or a multi-location dealer, Forestry Equipment Sales
                is built to help you connect with serious buyers and move equipment with less friction.
              </p>
            </div>
          </div>

          <div className="border border-line bg-[#1C1917] p-8 text-white md:p-12">
            <div className="mb-6 flex items-center space-x-3">
              <Zap className="text-accent" size={22} />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Our Mission</h3>
            </div>
            <ul className="space-y-4">
              {missionPoints.map((point) => (
                <li key={point} className="flex items-start space-x-3 text-sm font-medium leading-relaxed text-white/80">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-12">
            <span className="label-micro mb-4 block text-accent">Who We Serve</span>
            <h2 className="text-3xl font-black uppercase tracking-tighter md:text-5xl">
              Built For Contractors,
              <span className="text-muted"> Dealers, And Buyers</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {audiences.map(({ title, description, icon: Icon }) => (
              <div key={title} className="border border-line bg-bg p-8 transition-colors hover:border-accent">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-sm bg-surface text-accent">
                  <Icon size={24} />
                </div>
                <h3 className="mb-4 text-xl font-black uppercase tracking-tight">{title}</h3>
                <p className="text-sm font-medium leading-relaxed text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1600px] border border-line bg-surface p-8 md:p-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="label-micro mb-4 block text-accent">Get In Touch</span>
              <h2 className="mb-4 text-3xl font-black uppercase tracking-tighter md:text-5xl">
                Questions, Feedback,
                <span className="text-muted"> Or Partnership Ideas?</span>
              </h2>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted md:text-base">
                We answer the phone, respond to emails, and stay hands-on with the marketplace. If you want help
                buying, selling, financing, or planning your next move, our team is ready to help.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col xl:flex-row">
              <Link to="/contact" className="btn-industrial btn-accent px-8 py-4">
                Contact Us
              </Link>
              <Link to="/search" className="btn-industrial px-8 py-4">
                Browse Inventory
                <ArrowRight className="ml-2 inline" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
