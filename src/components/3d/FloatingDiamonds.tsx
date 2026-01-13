import { motion } from 'framer-motion';

export default function FloatingDiamonds() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating Diamond Shapes */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ 
            x: `${5 + (i * 8)}%`,
            y: `${15 + (i % 4) * 20}%`,
            rotate: 45,
            opacity: 0 
          }}
          animate={{ 
            y: [`${15 + (i % 4) * 20}%`, `${5 + (i % 4) * 20}%`, `${15 + (i % 4) * 20}%`],
            rotate: [45, 55, 45],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 5 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2
          }}
          style={{ left: `${3 + i * 8}%` }}
        >
          <div 
            className="w-6 h-6 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-gradient-to-br from-gold via-gold-light to-gold"
            style={{ 
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              boxShadow: '0 0 40px hsl(45 90% 55% / 0.5)',
              filter: 'blur(0.5px)'
            }}
          />
        </motion.div>
      ))}

      {/* Floating Rings - Enhanced */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute border-2 border-gold/25 rounded-full"
          initial={{ 
            opacity: 0,
            scale: 0.6
          }}
          animate={{ 
            opacity: [0.15, 0.35, 0.15],
            scale: [0.6, 1, 0.6],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ 
            width: `${80 + i * 50}px`,
            height: `${80 + i * 50}px`,
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            boxShadow: 'inset 0 0 20px hsl(45 90% 55% / 0.1)'
          }}
        />
      ))}

      {/* Sparkles - Enhanced */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: 'linear-gradient(135deg, hsl(45 90% 65%), hsl(45 90% 50%))',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: '0 0 15px hsl(45 90% 55% / 0.9)'
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.3, 1.5, 0.3]
          }}
          transition={{ 
            duration: 2.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Gradient Orbs - Enhanced */}
      <motion.div
        className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(45 90% 55% / 0.25) 0%, hsl(45 90% 55% / 0.1) 40%, transparent 70%)',
          left: '55%',
          top: '15%',
          filter: 'blur(20px)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.3, 0.15],
          x: [0, 20, 0],
          y: [0, -15, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute w-80 h-80 md:w-[500px] md:h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(160 45% 30% / 0.3) 0%, hsl(160 45% 20% / 0.1) 40%, transparent 70%)',
          left: '5%',
          bottom: '5%',
          filter: 'blur(30px)'
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.08, 0.2, 0.08],
          x: [0, -15, 0],
          y: [0, 10, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating Lines */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
          style={{
            width: `${100 + i * 50}px`,
            left: `${10 + i * 18}%`,
            top: `${25 + i * 12}%`,
            transform: `rotate(${-15 + i * 8}deg)`
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scaleX: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
        />
      ))}

      {/* 3D Cube Effect */}
      <motion.div
        className="absolute"
        style={{
          left: '70%',
          top: '60%',
          perspective: '1000px'
        }}
        animate={{
          rotateY: [0, 360],
          rotateX: [0, 15, 0, -15, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <div 
          className="w-12 h-12 md:w-16 md:h-16 border border-gold/20"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '0 0 30px hsl(45 90% 55% / 0.2)'
          }}
        />
      </motion.div>

      {/* Pulse Circles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute rounded-full border border-gold/20"
          style={{
            width: '100px',
            height: '100px',
            left: `${20 + i * 30}%`,
            top: `${70 - i * 20}%`
          }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}
