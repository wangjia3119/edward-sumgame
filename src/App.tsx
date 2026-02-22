/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Timer as TimerIcon, 
  Zap, 
  Pause,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { 
  GRID_COLUMNS, 
  GRID_ROWS, 
  INITIAL_ROWS, 
  MAX_NUMBER, 
  MIN_NUMBER, 
  TIME_MODE_DURATION,
  SCORE_PER_BLOCK,
  BONUS_PER_EXTRA_BLOCK
} from './constants';
import { GameMode, GameState, BlockData } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const generateRandomBlock = (): BlockData => ({
  id: generateId(),
  value: Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER,
  isSelected: false,
});

const generateTarget = () => Math.floor(Math.random() * 15) + 10; // Target between 10 and 25

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [mode, setMode] = useState<GameMode>('classic');
  const [grid, setGrid] = useState<BlockData[]>([]);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_MODE_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState(1);
  const [matches, setMatches] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [showLevelUp, setShowLevelUp] = useState(false);

  // Initialize Game
  const startGame = (selectedMode: GameMode) => {
    const initialGrid: BlockData[] = [];
    for (let i = 0; i < GRID_COLUMNS * INITIAL_ROWS; i++) {
      initialGrid.push(generateRandomBlock());
    }
    setGrid(initialGrid);
    setTarget(generateTarget());
    setScore(0);
    setLevel(1);
    setMatches(0);
    setCombo(0);
    setShowLevelUp(false);
    setMode(selectedMode);
    setGameState('playing');
    setTimeLeft(TIME_MODE_DURATION);
    setIsPaused(false);
  };

  const addNewRow = useCallback(() => {
    setGrid(prev => {
      const newRow = Array.from({ length: GRID_COLUMNS }, () => generateRandomBlock());
      return [...newRow, ...prev];
    });
    // Decrease time limit as level increases
    const newTime = Math.max(5, TIME_MODE_DURATION - (level - 1));
    setTimeLeft(newTime);
  }, [level]);

  // Check for game over
  useEffect(() => {
    if (grid.length >= GRID_COLUMNS * GRID_ROWS && gameState === 'playing') {
      setGameState('gameover');
    }
  }, [grid.length, gameState]);

  // Timer logic for Time Mode
  useEffect(() => {
    if (gameState === 'playing' && mode === 'time' && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            addNewRow();
            return TIME_MODE_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, mode, isPaused, addNewRow]);

  const currentSum = grid.filter(b => b.isSelected).reduce((acc, b) => acc + b.value, 0);

  const handleBlockClick = (id: string) => {
    if (gameState !== 'playing' || isPaused) return;

    setGrid(prev => {
      const clickedBlock = prev.find(b => b.id === id);
      if (!clickedBlock) return prev;

      // If already selected, deselect it
      if (clickedBlock.isSelected) {
        return prev.map(b => b.id === id ? { ...b, isSelected: false } : b);
      }

      const newGrid = prev.map(block => 
        block.id === id ? { ...block, isSelected: true } : block
      );
      
      const selectedBlocks = newGrid.filter(b => b.isSelected);
      const sum = selectedBlocks.reduce((acc, b) => acc + b.value, 0);

      if (sum === target) {
        // Success!
        const count = selectedBlocks.length;
        const points = (count * SCORE_PER_BLOCK) + (Math.max(0, count - 2) * BONUS_PER_EXTRA_BLOCK);
        const comboBonus = combo * 5;

        setScore(s => s + points + comboBonus);
        setTarget(generateTarget());
        setMatches(m => {
          const newMatches = m + 1;
          if (newMatches % 5 === 0) {
            setLevel(l => l + 1);
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 2000);
          }
          return newMatches;
        });
        setCombo(c => c + 1);
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 1000);
        
        if (mode === 'classic') {
          setTimeout(addNewRow, 100);
        }
        
        return newGrid.filter(b => !b.isSelected);
      } else if (sum > target) {
        // Over target, deselect all and break combo
        setCombo(0);
        return newGrid.map(b => ({ ...b, isSelected: false }));
      }

      return newGrid;
    });
  };

  const resetGame = () => {
    setGameState('menu');
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-md w-full"
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-display font-bold tracking-tighter text-white">
              数字<span className="text-emerald-500">消除</span>
            </h1>
            <p className="text-zinc-400 font-medium">掌握数学，消除方块。</p>
          </div>

          <div className="grid gap-4">
            <button 
              onClick={() => startGame('classic')}
              className="group relative flex items-center justify-between p-6 glass-panel hover:bg-white/10 transition-all text-left"
            >
              <div>
                <h3 className="text-xl font-bold text-white">经典模式</h3>
                <p className="text-sm text-zinc-400">每次匹配后新增一行。挑战生存极限。</p>
              </div>
              <Play className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
            </button>

            <button 
              onClick={() => startGame('time')}
              className="group relative flex items-center justify-between p-6 glass-panel hover:bg-white/10 transition-all text-left"
            >
              <div>
                <h3 className="text-xl font-bold text-white">计时模式</h3>
                <p className="text-sm text-zinc-400">在倒计时结束前完成匹配。挑战反应速度。</p>
              </div>
              <TimerIcon className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <div className="pt-8 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
              <Zap className="w-4 h-4" />
              <span>提示：使用更多方块可获得额外加分！</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white font-sans">
      {/* Header */}
      <header className="p-4 md:p-6 flex items-center justify-between glass-panel rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={resetGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">得分</div>
            <div className="text-2xl font-display font-bold tabular-nums">{score}</div>
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">等级</div>
            <div className="text-2xl font-display font-bold tabular-nums">{level}</div>
          </div>
        </div>

        <div className="flex flex-col items-center relative">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">目标</div>
          <motion.div 
            key={target}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-display font-bold text-emerald-500"
          >
            {target}
          </motion.div>
          
          <AnimatePresence>
            {showCombo && combo > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.5 }}
                animate={{ opacity: 1, y: -40, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute top-0 whitespace-nowrap bg-amber-500 text-zinc-950 px-3 py-1 rounded-full text-sm font-bold shadow-lg"
              >
                {combo}x 连击!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          {mode === 'time' && (
            <div className="text-right">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">时间</div>
              <div className={`text-2xl font-mono font-bold tabular-nums ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                {timeLeft}s
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        <div 
          className="grid gap-2 w-full max-w-md aspect-[6/10]"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
          }}
        >
          {/* Empty slots for visual structure */}
          {Array.from({ length: GRID_COLUMNS * GRID_ROWS }).map((_, i) => (
            <div key={`slot-${i}`} className="border border-white/5 rounded-lg" />
          ))}

          {/* Actual blocks */}
          <div className="absolute inset-0 grid gap-2 p-0"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
            }}
          >
            <AnimatePresence mode="popLayout">
              {grid.map((block, index) => {
                const row = Math.floor((grid.length - 1 - index) / GRID_COLUMNS);
                const col = (grid.length - 1 - index) % GRID_COLUMNS;
                // We want blocks to fill from bottom up
                const displayRow = GRID_ROWS - 1 - row;
                
                return (
                  <motion.div
                    key={block.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      gridRowStart: displayRow + 1,
                      gridColumnStart: col + 1
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={() => handleBlockClick(block.id)}
                    className={`
                      number-block rounded-xl border-2
                      ${block.isSelected 
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'}
                    `}
                  >
                    {block.value}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Level Up Notification */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute z-30 pointer-events-none"
            >
              <div className="bg-emerald-500 text-zinc-950 px-10 py-5 rounded-3xl shadow-2xl border-4 border-emerald-400">
                <div className="text-sm font-mono uppercase tracking-widest opacity-70">等级提升!</div>
                <div className="text-6xl font-display font-bold">等级 {level}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
            >
              <h2 className="text-4xl font-display font-bold mb-6">已暂停</h2>
              <button 
                onClick={() => setIsPaused(false)}
                className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-colors"
              >
                <Play className="w-5 h-5" />
                继续游戏
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center"
            >
              <AlertCircle className="w-20 h-20 text-red-500 mb-4" />
              <h2 className="text-5xl font-display font-bold mb-2">游戏结束</h2>
              <p className="text-zinc-400 mb-8 text-lg">方块已经触顶！</p>
              
              <div className="glass-panel p-8 mb-8 w-full max-w-xs">
                <div className="text-zinc-500 uppercase text-xs font-mono tracking-widest mb-1">最终得分</div>
                <div className="text-5xl font-display font-bold text-white">{score}</div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => startGame(mode)}
                  className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  再试一次
                </button>
                <button 
                  onClick={resetGame}
                  className="flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-colors"
                >
                  返回主菜单
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Controls */}
      <footer className="p-6 glass-panel rounded-none border-x-0 border-b-0">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">当前总和</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-display font-bold ${currentSum > target ? 'text-red-500' : 'text-white'}`}>
                {currentSum}
              </span>
              <span className="text-zinc-500">/ {target}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {grid.filter(b => b.isSelected).map(b => (
              <motion.div 
                key={`sel-${b.id}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-500"
              >
                {b.value}
              </motion.div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
