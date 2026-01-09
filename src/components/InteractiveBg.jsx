import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function InteractiveBg() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(() => ({
    background: {
      color: { value: "#0a192f" }, // Deep dark blue base
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "grab" }, // Connects dots to mouse
      },
      modes: {
        grab: { distance: 200, links: { opacity: 0.5 } },
      },
    },
    particles: {
      color: { value: ["#4ade80", "#60a5fa"] }, // Green and Blue colors
      links: {
        color: "#ffffff",
        distance: 150,
        enable: true,
        opacity: 0.2,
        width: 1,
      },
      move: {
        enable: true,
        speed: 1.5,
      },
      number: {
        value: 100, // Number of particles
      },
      opacity: { value: 0.5 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 4 } },
    },
  }), []);

  if (init) {
    return (
      <Particles
        id="tsparticles"
        options={options}
        className="absolute top-0 left-0 w-full h-full z-[-2]"
      />
    );
  }

  return null;
}