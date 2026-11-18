import type { CSSProperties } from 'react';
import { ArrowUpRight, EnvelopeSimple, MapPin, NavigationArrow, Phone, WhatsappLogo, type Icon } from '@phosphor-icons/react';
import { lienCarte, lienEmail, lienItineraire, lienTelephone, lienWhatsApp } from '../lib/liens';
import type { Parametres } from '../lib/types';

export function Contact({ p }: { p: Parametres }) {
  const adresse = p['contact.adresse'];
  const canaux: { libelle: string; valeur: string; href: string; Icone: Icon; fond: string; externe?: boolean }[] = [
    { libelle: 'Appeler', valeur: p['contact.telephone'], href: lienTelephone(p['contact.telephone']), Icone: Phone, fond: 'bg-navy' },
    { libelle: 'WhatsApp', valeur: p['contact.whatsapp'], href: lienWhatsApp(p['contact.whatsapp']), Icone: WhatsappLogo, fond: 'bg-rouge', externe: true },
    { libelle: 'E-mail', valeur: p['contact.email'], href: lienEmail(p['contact.email']), Icone: EnvelopeSimple, fond: 'bg-navy' },
  ];

  return (
    <section id="contact" className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl" data-reveal>
          <h2 className="font-display text-4xl font-black leading-[1] tracking-[-0.035em] sm:text-6xl">Nous contacter</h2>
          <p className="mt-6 text-lg leading-relaxed text-encre">{p['contact.texte']}</p>
        </div>

        <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5" data-reveal>
            <ul className="grid gap-3">
              {canaux.map(({ libelle, valeur, href, Icone, fond, externe }) => (
                <li key={libelle}>
                  <a href={href} {...(externe ? { target: '_blank', rel: 'noopener' } : {})} className="group flex items-center gap-4 rounded-2xl bg-perle p-4 transition-[background-color,transform] hover:bg-ligne active:scale-[.99] sm:p-5">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white ${fond}`}><Icone size={20} aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-encre">{libelle}</span>
                      <span className="block break-words font-display text-[15px] font-bold sm:text-lg">{valeur}</span>
                    </span>
                    <ArrowUpRight size={20} className="hidden text-encre transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-start gap-3">
              <MapPin size={24} className="mt-0.5 shrink-0" aria-hidden />
              <p>
                <span className="font-display text-lg font-bold">{adresse}</span>
                {p['contact.adresse_complement'] && <><br /><span className="text-encre">{p['contact.adresse_complement']}</span></>}
              </p>
            </div>
          </div>

          <figure className="flex flex-col lg:col-span-7" data-reveal style={{ '--d': '120ms' } as CSSProperties}>
            <div className="carte-wrap relative flex-1">
              <iframe title={`Carte : ${adresse}`} src={lienCarte(p['contact.carte_latitude'], p['contact.carte_longitude'])} loading="lazy" className="h-[320px] w-full rounded-[28px] border border-ligne sm:h-[400px] lg:h-full lg:min-h-[480px]" />
              {/* Sur écran tactile, la carte ne capte pas le défilement : on propose l'itinéraire à la place */}
              <a href={lienItineraire(adresse)} target="_blank" rel="noopener" className="itineraire absolute bottom-4 left-4 right-4 hidden h-12 items-center justify-center gap-2 rounded-xl bg-navy font-bold text-white shadow-[0_14px_28px_-12px_rgb(0_19_78/.6)] transition-transform active:scale-[.97]">
                <NavigationArrow size={18} aria-hidden />Ouvrir l’itinéraire
              </a>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
