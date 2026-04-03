import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, Users } from 'lucide-react';
import { ImageHero } from '../components/ImageHero';
import { Seo } from '../components/Seo';
import { useTheme } from '../components/ThemeContext';

const teamMembers = [
  {
    name: 'Aaron Blake',
    role: 'Co-Owner & Sales',
    bio: 'With more than 22 years of experience in logging and equipment sales, Aaron has built a reputation as someone you can trust and who knows how to get deals done. He manages risk, supports all sales, and helps clients secure financing to close deals.',
  },
  {
    name: 'Erik Madsen',
    role: 'Co-Owner & Sales',
    bio: 'Erik brings sharp instincts and hands-on knowledge of equipment. He helps sellers move their machines efficiently, supports financing efforts, and uses his industry knowledge to drive results-oriented deals.',
  },
  {
    name: 'Caleb Happy',
    role: 'Marketing & Platform Development',
    bio: 'Caleb brings eight years of marketing experience and a hands-on systems mindset. He handles marketing, infrastructure, and customer relations to keep the platform running smoothly.',
  },
];

export function OurTeam() {
  const { theme } = useTheme();
  const heroHeadingClass = theme === 'dark' ? 'text-white' : 'text-ink';
  const heroSecondaryClass = theme === 'dark' ? 'text-white/70' : 'text-accent';
  const heroBodyClass = theme === 'dark' ? 'text-white/70' : 'text-muted';
  const contactPanelClass = theme === 'dark' ? 'border border-white/10 bg-[#1C1917] text-white' : 'border border-line bg-surface text-ink';
  const contactItemClass = theme === 'dark'
    ? 'border border-white/10 text-white hover:border-accent'
    : 'border border-line bg-bg text-ink hover:border-accent';
  const contactMetaClass = theme === 'dark' ? 'text-white/60' : 'text-muted';

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Our Team | Forestry Equipment Sales"
        description="Meet the Forestry Equipment Sales team behind the marketplace, logistics coordination, customer support, and platform development."
        canonicalPath="/our-team"
        imagePath="/page-photos/john-deere-harvester.webp"
        preloadImage="/page-photos/our-team.webp"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'AboutPage',
              name: 'Our Team | Forestry Equipment Sales',
              description: 'Meet the Forestry Equipment Sales team behind the marketplace, logistics coordination, customer support, and platform development.',
              url: 'https://timberequip.com/our-team',
            },
            {
              '@type': 'Organization',
              name: 'Forestry Equipment Sales',
              url: 'https://timberequip.com',
              telephone: '(218) 720-0933',
              email: 'support@forestryequipmentsales.com',
              member: [
                {
                  '@type': 'Person',
                  name: 'Aaron Blake',
                  jobTitle: 'Co-Owner & Sales',
                },
                {
                  '@type': 'Person',
                  name: 'Erik Madsen',
                  jobTitle: 'Co-Owner & Sales',
                },
                {
                  '@type': 'Person',
                  name: 'Caleb Happy',
                  jobTitle: 'Marketing & Platform Development',
                },
              ],
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://timberequip.com' },
                { '@type': 'ListItem', position: 2, name: 'Our Team', item: 'https://timberequip.com/our-team' },
              ],
            },
          ],
        }}
      />

      <ImageHero imageSrc="/page-photos/our-team.webp" imageAlt="The Forestry Equipment Sales team">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <Users className="text-accent" size={20} />
            <span className="label-micro text-accent">Our Team</span>
          </div>
          <h1 className={`mb-8 text-5xl font-black uppercase tracking-tighter leading-none md:text-7xl ${heroHeadingClass}`}>
            We Know The Industry
            <br />
            <span className={heroSecondaryClass}>Because We Are From It</span>
          </h1>
          <p className={`max-w-3xl text-base font-medium leading-relaxed md:text-lg ${heroBodyClass}`}>
            This platform was not built by tech investors. It was built by people who have spent years around
            equipment, sellers, buyers, shipping, and the real work it takes to move iron.
          </p>
        </div>
      </ImageHero>

      <section className="bg-bg px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-12 max-w-4xl">
            <span className="label-micro mb-4 block text-accent">Meet The Team</span>
            <p className="text-sm font-medium leading-relaxed text-muted md:text-base">
              We understand what it takes to move equipment and how frustrating outdated listing platforms can be.
              Our team stays lean, responsive, and focused on helping buyers and sellers move faster with less hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.name} className="flex flex-col overflow-hidden border border-line bg-surface">
                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg border border-line">
                    <Users className="text-accent" size={24} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{member.name}</h2>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-accent">{member.role}</p>
                  <p className="mt-5 text-sm font-medium leading-relaxed text-muted">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface px-4 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1600px] grid grid-cols-1 gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="border border-line bg-bg p-8 md:p-10">
            <span className="label-micro mb-4 block text-accent">Our Pledge</span>
            <h2 className="mb-4 text-3xl font-black uppercase tracking-tighter md:text-5xl">
              We Keep It
              <span className="text-muted"> Straightforward</span>
            </h2>
            <p className="text-sm font-medium leading-relaxed text-muted md:text-base">
              We answer the phone. We respond to emails. And we do everything we can to help contractors and equipment
              dealers move machines faster without the BS. This platform is built on hard work, relationships, and
              respect for the industry we serve.
            </p>
          </div>

          <div className={`${contactPanelClass} p-8 md:p-10`}>
            <span className="label-micro mb-4 block text-accent">Reach Us</span>
            <div className="space-y-4">
              <a href="tel:+12187200933" className={`flex items-start space-x-3 p-4 transition-colors ${contactItemClass}`}>
                <Phone className="mt-0.5 text-accent" size={18} />
                <div>
                  <span className={`label-micro block ${contactMetaClass}`}>Customer Support</span>
                  <span className="text-sm font-black tracking-tight">(218) 720-0933</span>
                </div>
              </a>
              <a href="mailto:support@forestryequipmentsales.com" className={`flex min-w-0 items-start space-x-3 p-4 transition-colors ${contactItemClass}`}>
                <Mail className="mt-0.5 text-accent" size={18} />
                <div className="min-w-0">
                  <span className={`label-micro block ${contactMetaClass}`}>Email</span>
                  <span className="block break-all text-sm font-black tracking-tight">support@forestryequipmentsales.com</span>
                </div>
              </a>
              <div className="pt-2">
                <Link to="/contact" className="btn-industrial btn-accent px-8 py-4">
                  Contact Us
                  <ArrowRight className="ml-2 inline" size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
