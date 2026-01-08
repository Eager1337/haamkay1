import { motion } from 'framer-motion';

export default function FloatingDiamonds() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating Diamond Shapes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ 
            x: `${10 + (i * 12)}%`,
            y: `${20 + (i % 3) * 30}%`,
            rotate: 45,
            opacity: 0 
          }}
          animate={{ 
            y: [`${20 + (i % 3) * 30}%`, `${10 + (i % 3) * 30}%`, `${20 + (i % 3) * 30}%`],
            rotate: [45, 50, 45],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3
          }}
          style={{ left: `${5 + i * 12}%` }}
        >
          <div 
            className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-gold via-gold-light to-gold"
            style={{ 
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              boxShadow: '0 0 30px hsl(45 90% 55% / 0.4)'
            }}
          />
        </motion.div>
      ))}

      {/* Floating Rings */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute border-2 border-gold/30 rounded-full"
          initial={{ 
            opacity: 0,
            scale: 0.8
          }}
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [0.8, 1, 0.8],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ 
            width: `${60 + i * 40}px`,
            height: `${60 + i * 40}px`,
            left: `${20 + i * 20}%`,
            top: `${30 + (i % 2) * 25}%`
          }}
        />
      ))}

      {/* Sparkles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 bg-gold rounded-full"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3
          }}
          style={{ 
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: '0 0 10px hsl(45 90% 55% / 0.8)'
          }}
        />
      ))}

      {/* Gradient Orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(45 90% 55% / 0.3) 0%, transparent 70%)',
          left: '60%',
          top: '20%'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, hsl(160 45% 25% / 0.4) 0%, transparent 70%)',
          left: '10%',
          bottom: '10%'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
