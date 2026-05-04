"use client";

import { PromoGridItem } from "../molecules/PromoGridItem";

export function PromoBentoGrid() {
  return (
    <section className="max-w-[1500px] mx-auto w-full px-4 md:px-12 py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 auto-rows-auto md:auto-rows-[450px]">
        {/* Top Left: Wide Block */}
        <PromoGridItem
          title={"Nombre de\nProveedor 1"}
          imageUrl="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2370&auto=format&fit=crop"
          href="https://www2.hm.com/es_mx/index.html?utm_source=google&utm_medium=cpc&utm_campaign=mkt_mx|mpl_google|lng_spa|atc_activity|ity_brand|obj_omni-sales|cpt_search|dct_combined|mi_mxgu06gs3aa5&utm_term=hm&gad_source=1&gad_campaignid=23625785960&gbraid=0AAAAADvrmzTWz2d0TO7DHkxKAHJYRMML0&gclid=CjwKCAjw5NvPBhAoEiwA_2egfjefRcy6ONZvEwDAO-3Gabveawmze3MEbq9ggaSSjo7ce2Ng-4D7yxoCMCYQAvD_BwE"
          ctaText="Explorar Catálogo"
          className="md:col-span-8 min-h-[400px] md:min-h-0"
          priority={true}
        />

        {/* Top Right: Square Text Block */}
        <PromoGridItem
          title={
            <>
              Empresa <span className="italic">número</span> 4.
            </>
          }
          description="Explora tendencias que elevarán la percepción de tu marca ante clientes y equipo."
          href="https://www.carolinaherrera.com/mx/es/?utm_source=adwords&utm_medium=paid_search_brand&utm_content=conversion&utm_bu=all&utm_mkbr=&utm_campaign=CH_MEX_Brand_SPA_ALL_Global_CONV&utm_term=carolina%20herrera&utm_clicktype=text&gad_source=1&gad_campaignid=21878468308&gbraid=0AAAAADF0va5bhNWkbtsKJISoL7OklfCJw&gclid=CjwKCAjw5NvPBhAoEiwA_2egftpIecOzt4S6UdpUQArYovyN5IvNM4sfs0umDYMq72ZZ_XPYfC_d2xoCotUQAvD_BwE"
          ctaText="Explorar EcoPromo"
          type="text"
          bgClassName="bg-[#fcf8f2]"
          className="md:col-span-4"
          delay={0.2}
        />

        {/* Bottom Left: Square Text Block */}
        <PromoGridItem
          title={
            <>
              Proveedor <br />3 nombre
            </>
          }
          description="Calidad garantizada y tiempos de entrega optimizados para grandes volúmenes."
          href="https://www.gucci.com/es/es/st/stories/article/a-new-quintessence"
          ctaText="Ver Proveedor Alpha"
          type="text"
          bgClassName="bg-white border border-gray-100"
          className="md:col-span-4 order-last md:order-none"
          delay={0.3}
        />

        {/* Bottom Right: Wide Block */}
        <PromoGridItem
          title={
            <>
              Y proveedor <br />
              número 4
            </>
          }
          imageUrl="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2370&auto=format&fit=crop"
          href="https://www.hermes.com/mx/es/?utm_source=google&utm_medium=cpc&utm_campaign=MX_ES_DEFENSIVE_BRAND_CORE&utm_term=Brand_Core_-_%5BExact%5D&gad_source=1&gad_campaignid=21636755445&gbraid=0AAAAA994yvNjCrr519mfaC_tapMkiiAQm&gclid=CjwKCAjw5NvPBhAoEiwA_2egfuyFi1bSlCYHPvAj1iXaCb04J6hmAlUxLy1WHASSBVT7ZiOqTFNI6RoCVEMQAvD_BwE"
          ctaText="Bordado Premium"
          className="md:col-span-8 min-h-[400px] md:min-h-0"
          delay={0.4}
        />
      </div>
    </section>
  );
}
