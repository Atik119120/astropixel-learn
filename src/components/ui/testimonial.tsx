import React, { useRef } from "react";
import { TimelineContent } from "@/components/ui/timeline-animation";

function ClientFeedback() {
  const testimonialRef = useRef<HTMLDivElement>(null);

  const revealVariants: any = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.35,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  return (
    <main className="w-full bg-white text-black py-6 md:py-10 rounded-3xl overflow-hidden">
      <section className="relative h-full container mx-auto max-w-6xl" ref={testimonialRef}>
        <article className="max-w-screen-md mx-auto text-center space-y-2 mb-8 md:mb-10">
          <TimelineContent
            as="h2"
            className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 max-w-xl mx-auto"
            animationNum={0}
            customVariants={revealVariants}
            timelineRef={testimonialRef}
          >
            Trusted by Startups and the world's largest companies
          </TimelineContent>
          <TimelineContent
            as="p"
            className="mx-auto text-slate-500 text-sm sm:text-base max-w-lg leading-relaxed"
            animationNum={1}
            customVariants={revealVariants}
            timelineRef={testimonialRef}
          >
            Let's hear how hypersphere client's feels about our service
          </TimelineContent>
        </article>

        <div className="lg:grid lg:grid-cols-3 gap-3 flex flex-col w-full px-2 sm:px-4">
          {/* Column 1 */}
          <div className="flex flex-col gap-3">
            <TimelineContent
              animationNum={0}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="lg:flex-[7] flex-[6] flex flex-col justify-between relative bg-white text-slate-900 overflow-hidden rounded-xl border border-gray-200 p-5 shadow-sm min-h-[220px] group transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:45px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none" />
              <article className="relative z-10 mt-auto pt-10">
                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed mb-3">
                  "Hypersphere has been a game-changer for us. Their service is top-notch and their team is incredibly responsive."
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900">Guillermo Rauch</h3>
                    <p className="text-xs text-slate-500">CEO of Enigma</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop"
                    alt="Guillermo Rauch"
                    loading="eager"
                    decoding="sync"
                    className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </article>
            </TimelineContent>

            <TimelineContent
              animationNum={1}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="lg:flex-[3] flex-[4] flex flex-col justify-between relative bg-[#1b64f2] text-white overflow-hidden rounded-xl border border-blue-500 p-5 shadow-md group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <article className="relative z-10 mt-auto">
                <p className="text-blue-50 text-xs sm:text-sm leading-relaxed mb-3">
                  "We've seen incredible results with Hypersphere. Their expertise, dedication."
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-blue-400/40">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-white">Rika Shinoda</h3>
                    <p className="text-xs text-blue-200">CEO of Kintsugi</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?q=80&w=200&auto=format&fit=crop"
                    alt="Rika Shinoda"
                    loading="eager"
                    decoding="sync"
                    className="w-12 h-12 rounded-xl object-cover border border-blue-400/50 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-3">
            <TimelineContent
              animationNum={2}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="flex flex-col justify-between relative bg-[#111111] text-white overflow-hidden rounded-xl border border-gray-800 p-5 shadow-md group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <article className="relative z-10 mt-auto">
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-3">
                  "Their team is highly professional, and their innovative solutions have truly transformed the way we operate."
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-white">Reacher</h3>
                    <p className="text-xs text-slate-400">CEO of OdeaoLabs</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=200&auto=format&fit=crop"
                    alt="Reacher"
                    loading="eager"
                    decoding="sync"
                    className="w-12 h-12 rounded-xl object-cover border border-gray-700 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </article>
            </TimelineContent>

            <TimelineContent
              animationNum={3}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="flex flex-col justify-between relative bg-[#111111] text-white overflow-hidden rounded-xl border border-gray-800 p-5 shadow-md group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <article className="relative z-10 mt-auto">
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-3">
                  "We're extremely satisfied with Hypersphere. Their expertise and dedication have exceeded our expectations."
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-white">John</h3>
                    <p className="text-xs text-slate-400">CEO of Labsbo</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=200&auto=format&fit=crop"
                    alt="John"
                    loading="eager"
                    decoding="sync"
                    className="w-12 h-12 rounded-xl object-cover border border-gray-700 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </article>
            </TimelineContent>

            <TimelineContent
              animationNum={4}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="flex flex-col justify-between relative bg-[#111111] text-white overflow-hidden rounded-xl border border-gray-800 p-5 shadow-md group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <article className="relative z-10 mt-auto">
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-3">
                  "Their customer support is absolutely exceptional. They are always available, incredibly helpful."
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-white">Steven Sunny</h3>
                    <p className="text-xs text-slate-400">CEO of boxefi</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                    alt="Steven Sunny"
                    loading="eager"
                    decoding="sync"
                    className="w-12 h-12 rounded-xl object-cover border border-gray-700 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-3">
            <TimelineContent
              animationNum={5}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="lg:flex-[3] flex-[4] flex flex-col justify-between relative bg-[#1b64f2] text-white overflow-hidden rounded-xl border border-blue-500 p-5 shadow-md group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <article className="relative z-10 mt-auto">
                <p className="text-blue-50 text-xs sm:text-sm leading-relaxed mb-3">
                  "Hypersphere has been a key partner in our growth journey."
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-blue-400/40">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-white">Guillermo Rauch</h3>
                    <p className="text-xs text-blue-200">CEO of OdeaoLabs</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1563237023-b1e970526dcb?q=80&w=200&auto=format&fit=crop"
                    alt="Guillermo Rauch"
                    loading="eager"
                    decoding="sync"
                    className="w-12 h-12 rounded-xl object-cover border border-blue-400/50 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </article>
            </TimelineContent>

            <TimelineContent
              animationNum={6}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="lg:flex-[7] flex-[6] flex flex-col justify-between relative bg-white text-slate-900 overflow-hidden rounded-xl border border-gray-200 p-5 shadow-sm min-h-[220px] group transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:45px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none" />
              <article className="relative z-10 mt-auto pt-10">
                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed mb-3">
                  "Hypersphere has been a true game-changer for us. Their exceptional service, combined with their deep expertise and commitment to excellence, has made a significant impact on our business."
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900">Paul Brauch</h3>
                    <p className="text-xs text-slate-500">CTO of Spectrum</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1590086782957-93c06ef21604?q=80&w=200&auto=format&fit=crop"
                    alt="Paul Brauch"
                    loading="eager"
                    decoding="sync"
                    className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ClientFeedback;
