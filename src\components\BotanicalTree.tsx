import React from 'react';
import { TreeSpecies } from '../types/focustab';
import { getTreeGrowthStage } from '../utils/storage';

interface BotanicalTreeProps {
  progressPercent: number; // 0 to 100 continuous
  mode: 'focus' | 'break' | 'break_complete';
  isPaused?: boolean;
  darkMode?: boolean;
  size?: 'compact' | 'regular' | 'large';
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Normalizes progress within a specific [start, end] percentage band to [0, 1].
 */
function bandProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

export const BotanicalTree: React.FC<BotanicalTreeProps> = ({
  progressPercent,
  mode,
  isPaused = false,
  darkMode = false,
  size = 'regular',
}) => {
  const effectiveProgress = mode === 'focus' ? clamp(progressPercent, 0, 100) : 100;
  const stageInfo = getTreeGrowthStage(effectiveProgress);

  // Smooth continuous interpolation factors across the 6 botanical stages:
  // Stage 1 (0 - 20%): Seed & sprout emerging from soil
  const s1 = bandProgress(effectiveProgress, 0, 20);
  // Stage 2 (20 - 40%): Small plant with first true leaves
  const s2 = bandProgress(effectiveProgress, 20, 40);
  // Stage 3 (40 - 60%): Young tree with woody trunk & primary branches
  const s3 = bandProgress(effectiveProgress, 40, 60);
  // Stage 4 (60 - 80%): Larger tree with secondary branches & fuller foliage
  const s4 = bandProgress(effectiveProgress, 60, 80);
  // Stage 5 (80 - 99%): Mature tree with deep layered canopy
  const s5 = bandProgress(effectiveProgress, 80, 99);
  // Stage 6 (100%): Full-grown blooming tree
  const s6 = effectiveProgress >= 99.5 ? 1 : bandProgress(effectiveProgress, 96, 100);

  // Continuous trunk height from y=168 (ground) upward
  const stemHeight =
    14 + // initial tiny shoot at 0%
    s1 * 18 + // reaches 32px at 20%
    s2 * 24 + // reaches 56px at 40%
    s3 * 24 + // reaches 80px at 60%
    s4 * 16 + // reaches 96px at 80%
    s5 * 8;   // reaches 104px at 100%

  const stemTopY = 168 - stemHeight;
  const trunkBaseWidth = 2.2 + s2 * 1.6 + s3 * 3.2 + s4 * 2.8 + s5 * 2.2;
  const trunkTopWidth = 1.2 + s3 * 1.2 + s4 * 1.0;

  const dimensions =
    size === 'compact'
      ? 'w-36 h-36'
      : size === 'large'
        ? 'w-56 h-56'
        : 'w-44 h-44';

  const swayClass = isPaused ? 'animate-sway-paused' : 'animate-sway';

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className={`relative ${dimensions} flex items-center justify-center`}>
        <svg
          viewBox="0 0 220 210"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={
            mode === 'break'
              ? 'Relaxed botanical tree during break time'
              : `Growing botanical tree at ${Math.round(effectiveProgress)}% (${stageInfo.label})`
          }
        >
          <defs>
            <radialGradient id="canopyGlowLight" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor={mode === 'break' ? '#E9DFCE' : '#DCE7DC'} stopOpacity="0.75" />
              <stop offset="100%" stopColor={mode === 'break' ? '#E9DFCE' : '#DCE7DC'} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="canopyGlowDark" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor={mode === 'break' ? '#3E352B' : '#24382B'} stopOpacity="0.65" />
              <stop offset="100%" stopColor="#18201B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Soft ambient botanical aura behind tree */}
          <circle
            cx="110"
            cy="102"
            r={64 + s3 * 14 + s5 * 8}
            fill={darkMode ? 'url(#canopyGlowDark)' : 'url(#canopyGlowLight)'}
          />

          {/* Subtle progress arc around the botanical vignette */}
          <circle
            cx="110"
            cy="105"
            r="88"
            fill="none"
            stroke={darkMode ? 'rgba(148, 168, 152, 0.12)' : 'rgba(74, 107, 83, 0.10)'}
            strokeWidth="1.5"
          />
          <circle
            cx="110"
            cy="105"
            r="88"
            fill="none"
            stroke={
              mode === 'break'
                ? darkMode
                  ? '#C49F77'
                  : '#9A7551'
                : darkMode
                  ? '#7FA889'
                  : '#4A6B53'
            }
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - effectiveProgress / 100)}
            transform="rotate(-90 110 105)"
            style={{ transition: 'stroke-dashoffset 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          />

          {/* Break Mode crescent / afternoon sun */}
          {mode === 'break' && (
            <g className="opacity-85">
              <circle
                cx="156"
                cy="46"
                r="12"
                fill={darkMode ? '#D8B48A' : '#E3B982'}
                fillOpacity="0.35"
              />
              <circle
                cx="156"
                cy="46"
                r="7"
                fill={darkMode ? '#E5C69F' : '#D49B58'}
                fillOpacity="0.65"
              />
            </g>
          )}

          {/* Ground shadow & layered earthen soil mound */}
          <ellipse
            cx="110"
            cy="172"
            rx={42 + s3 * 14}
            ry="6.5"
            fill={darkMode ? '#141B16' : '#E2DBD0'}
          />
          <path
            d="M 64 170 Q 110 156 156 170 Z"
            fill={darkMode ? '#332C25' : '#C7B9A5'}
          />
          <path
            d="M 76 170 Q 110 160 144 170 Z"
            fill={darkMode ? '#43392F' : '#B3A18B'}
          />

          {/* Subtle underground root filaments (grow with stages 2-5) */}
          {effectiveProgress > 15 && (
            <g
              stroke={darkMode ? '#594A3C' : '#96826B'}
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              opacity={clamp((effectiveProgress - 15) / 60, 0, 0.75)}
            >
              <path d={`M 110 168 Q 102 174 ${102 - s3 * 12} ${176 + s4 * 3}`} />
              <path d={`M 110 168 Q 118 174 ${118 + s3 * 12} ${176 + s4 * 3}`} />
              {s4 > 0 && <path d={`M 110 169 Q 110 176 108 ${178 + s4 * 3}`} />}
            </g>
          )}

          {/* Main Living Tree Group with gentle sway */}
          <g className={swayClass}>
            {/* STAGE 1 (0 - 20%): Seed coat at base */}
            {effectiveProgress < 38 && (
              <ellipse
                cx="110"
                cy="165"
                rx={4.5 * (1 - s2 * 0.7)}
                ry={3.2 * (1 - s2 * 0.7)}
                fill={darkMode ? '#7C5E46' : '#6E5039'}
              />
            )}

            {/* Trunk / Stem: transitions from tender green shoot (0-40%) to warm woody bark (40-100%) */}
            <path
              d={`
                M ${110 - trunkBaseWidth} 168
                Q ${110 - trunkBaseWidth * 0.65} ${168 - stemHeight * 0.5} ${110 - trunkTopWidth} ${stemTopY}
                L ${110 + trunkTopWidth} ${stemTopY}
                Q ${110 + trunkBaseWidth * 0.65} ${168 - stemHeight * 0.5} ${110 + trunkBaseWidth} 168
                Z
              `}
              fill={
                effectiveProgress < 35
                  ? darkMode
                    ? '#6A9475'
                    : '#557B5E'
                  : darkMode
                    ? '#85664D'
                    : '#75563E'
              }
            />

            {/* STAGE 1 & 2 (0 - 40%): Early Cotyledon & Sprout Leaves */}
            {effectiveProgress < 55 && (
              <g
                opacity={effectiveProgress < 42 ? 1 : 1 - bandProgress(effectiveProgress, 42, 55)}
                transform={`translate(110, ${stemTopY + 4})`}
              >
                {/* Left sprout leaf */}
                <path
                  d="M 0 2 C -6 -6, -18 -8, -20 -1 C -16 6, -6 6, 0 2 Z"
                  fill={darkMode ? '#7FA889' : '#5E8768'}
                  transform={`scale(${0.45 + s1 * 0.55 + s2 * 0.2}) rotate(${-10 + s1 * 12})`}
                />
                {/* Right sprout leaf */}
                <path
                  d="M 0 2 C 6 -6, 18 -8, 20 -1 C 16 6, 6 6, 0 2 Z"
                  fill={darkMode ? '#93B89C' : '#719A7B'}
                  transform={`scale(${0.4 + s1 * 0.6 + s2 * 0.2}) rotate(${10 - s1 * 12})`}
                />
              </g>
            )}

            {/* STAGE 2 (20 - 40%): Small Plant True Leaves along stem */}
            {s2 > 0 && effectiveProgress < 68 && (
              <g
                opacity={
                  effectiveProgress < 52
                    ? s2
                    : (1 - bandProgress(effectiveProgress, 52, 68)) * 0.9
                }
              >
                <path
                  d={`M 109 ${stemTopY + 18} C 96 ${stemTopY + 10}, 84 ${stemTopY + 12}, 82 ${stemTopY + 20} C 88 ${stemTopY + 26}, 100 ${stemTopY + 24}, 109 ${stemTopY + 18} Z`}
                  fill={darkMode ? '#6C9676' : '#4E7558'}
                  transform={`scale(${0.3 + s2 * 0.7})`}
                  style={{ transformOrigin: `109px ${stemTopY + 18}px` }}
                />
                <path
                  d={`M 111 ${stemTopY + 14} C 124 ${stemTopY + 6}, 136 ${stemTopY + 8}, 138 ${stemTopY + 16} C 132 ${stemTopY + 22}, 120 ${stemTopY + 20}, 111 ${stemTopY + 14} Z`}
                  fill={darkMode ? '#83AC8D' : '#638C6D'}
                  transform={`scale(${0.3 + s2 * 0.7})`}
                  style={{ transformOrigin: `111px ${stemTopY + 14}px` }}
                />
              </g>
            )}

            {/* STAGE 3+ (40 - 100%): Woody Branches */}
            {s3 > 0 && (
              <g
                stroke={darkMode ? '#85664D' : '#75563E'}
                strokeLinecap="round"
                fill="none"
              >
                {/* Left primary branch */}
                <path
                  d={`M 109 ${168 - stemHeight * 0.52} Q ${96 - s4 * 6} ${168 - stemHeight * 0.64} ${86 - s4 * 10} ${168 - stemHeight * 0.74}`}
                  strokeWidth={2.2 + s4 * 1.4}
                  opacity={clamp(s3 * 1.3, 0, 1)}
                />
                {/* Right primary branch */}
                <path
                  d={`M 111 ${168 - stemHeight * 0.56} Q ${124 + s4 * 6} ${168 - stemHeight * 0.68} ${134 + s4 * 10} ${168 - stemHeight * 0.78}`}
                  strokeWidth={2.2 + s4 * 1.4}
                  opacity={clamp(s3 * 1.3, 0, 1)}
                />
                {/* Upper fork branches for Stage 4 & 5 */}
                {s4 > 0 && (
                  <>
                    <path
                      d={`M 109 ${168 - stemHeight * 0.75} Q 96 ${168 - stemHeight * 0.88} ${88 - s5 * 6} ${168 - stemHeight * 0.96}`}
                      strokeWidth={1.8 + s5 * 0.8}
                      opacity={s4}
                    />
                    <path
                      d={`M 111 ${168 - stemHeight * 0.78} Q 124 ${168 - stemHeight * 0.9} ${132 + s5 * 6} ${168 - stemHeight * 0.98}`}
                      strokeWidth={1.8 + s5 * 0.8}
                      opacity={s4}
                    />
                  </>
                )}
              </g>
            )}

            {/* STAGE 3 (40 - 60%): Young Tree Canopy Clusters */}
            {s3 > 0 && (
              <g className="animate-leaf-breathe">
                {/* Deep background foliage layer (Stage 4 & 5) */}
                {s4 > 0 && (
                  <g opacity={clamp(s4 * 1.15, 0, 1)}>
                    <circle
                      cx={80 - s5 * 5}
                      cy={102 - s5 * 4}
                      r={(16 + s4 * 8 + s5 * 5) * s4}
                      fill={darkMode ? '#35523E' : '#3B5B45'}
                    />
                    <circle
                      cx={140 + s5 * 5}
                      cy={100 - s5 * 4}
                      r={(16 + s4 * 8 + s5 * 5) * s4}
                      fill={darkMode ? '#35523E' : '#3B5B45'}
                    />
                    <circle
                      cx="110"
                      cy={72 - s5 * 8}
                      r={(20 + s4 * 9 + s5 * 6) * s4}
                      fill={darkMode ? '#3D5E47' : '#43664E'}
                    />
                  </g>
                )}

                {/* Mid-layer sage foliage clusters (Stage 3, 4, 5) */}
                <circle
                  cx={92 - s4 * 6}
                  cy={168 - stemHeight * 0.76}
                  r={(12 + s3 * 8 + s4 * 6 + s5 * 4) * clamp(s3 * 1.2, 0, 1)}
                  fill={darkMode ? '#4A6F56' : '#4F775B'}
                />
                <circle
                  cx={128 + s4 * 6}
                  cy={168 - stemHeight * 0.78}
                  r={(12 + s3 * 8 + s4 * 6 + s5 * 4) * clamp(s3 * 1.2, 0, 1)}
                  fill={darkMode ? '#527A5F' : '#578264'}
                />
                <circle
                  cx="110"
                  cy={168 - stemHeight * 0.96}
                  r={(15 + s3 * 10 + s4 * 7 + s5 * 5) * clamp(s3 * 1.2, 0, 1)}
                  fill={darkMode ? '#5E8A6C' : '#628F6F'}
                />

                {/* Stage 5 (80 - 99%): Mature Tree Lush Outer & Upper Highlights */}
                {s5 > 0 && (
                  <g opacity={clamp(s5 * 1.15, 0, 1)}>
                    <circle
                      cx="72"
                      cy="92"
                      r={16 * s5}
                      fill={darkMode ? '#598266' : '#689676'}
                    />
                    <circle
                      cx="148"
                      cy="92"
                      r={16 * s5}
                      fill={darkMode ? '#598266' : '#689676'}
                    />
                    <circle
                      cx="94"
                      cy="68"
                      r={19 * s5}
                      fill={darkMode ? '#6D9B7B' : '#78A685'}
                    />
                    <circle
                      cx="126"
                      cy="68"
                      r={19 * s5}
                      fill={darkMode ? '#649172' : '#709E7D'}
                    />
                    <circle
                      cx="110"
                      cy="56"
                      r={18 * s5}
                      fill={darkMode ? '#79A887' : '#85B392'}
                    />
                  </g>
                )}

                {/* Subtle trunk & branch peek-through lines inside canopy for architectural realism */}
                {s3 > 0.5 && (
                  <g
                    stroke={darkMode ? '#6E533E' : '#5F4430'}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.65}
                  >
                    <path d={`M 110 ${168 - stemHeight * 0.55} L 110 ${168 - stemHeight * 0.85}`} />
                    <path d={`M 110 ${168 - stemHeight * 0.68} L 96 ${168 - stemHeight * 0.79}`} />
                    <path d={`M 110 ${168 - stemHeight * 0.71} L 124 ${168 - stemHeight * 0.82}`} />
                  </g>
                )}

                {/* STAGE 6 (100%): Full-Grown Botanical Blossoms & Fruit Buds */}
                {s6 > 0 && (
                  <g opacity={s6} style={{ transition: 'opacity 400ms ease-out' }}>
                    {[
                      { cx: 110, cy: 48 },
                      { cx: 86, cy: 66 },
                      { cx: 134, cy: 65 },
                      { cx: 70, cy: 90 },
                      { cx: 148, cy: 88 },
                      { cx: 98, cy: 88 },
                      { cx: 124, cy: 92 },
                      { cx: 82, cy: 108 },
                      { cx: 136, cy: 108 },
                    ].map((flower, i) => (
                      <g key={i} transform={`translate(${flower.cx}, ${flower.cy}) scale(${0.7 + s6 * 0.3})`}>
                        <circle r="3.8" fill={darkMode ? '#F4EFE6' : '#FFFDF9'} />
                        <circle r="1.6" fill={mode === 'break' ? '#D99B66' : '#E2A857'} />
                      </g>
                    ))}
                  </g>
                )}
              </g>
            )}
          </g>

          {/* Break Mode Companion Element: Warm Ceramic Cup & Gentle Resting Leaves */}
          {mode === 'break' && (
            <g transform="translate(136, 152)">
              {/* Flat garden stone */}
              <ellipse cx="10" cy="17" rx="14" ry="3.5" fill={darkMode ? '#52493F' : '#9E9284'} />
              {/* Ceramic mug */}
              <rect x="3" y="6" width="12" height="10" rx="2.5" fill={darkMode ? '#E6DEC8' : '#F7F3EB'} stroke={darkMode ? '#8C7A65' : '#8A7968'} strokeWidth="1.2" />
              <path d="M 15 8.5 C 18 8.5, 18 13.5, 15 13.5" fill="none" stroke={darkMode ? '#8C7A65' : '#8A7968'} strokeWidth="1.2" />
              {/* Gentle steam */}
              <path d="M 7 3 Q 5.5 0 7.5 -3" fill="none" stroke={darkMode ? '#C4B69E' : '#8A7968'} strokeWidth="1.1" strokeLinecap="round" className="animate-steam-1" />
              <path d="M 11 2.5 Q 12.5 -0.5 10.5 -3.5" fill="none" stroke={darkMode ? '#C4B69E' : '#8A7968'} strokeWidth="1.1" strokeLinecap="round" className="animate-steam-2" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

/**
 * Miniature handcrafted botanical tree icon used inside the user's Focus Garden
 * for each completed session.
 */
export const MiniGardenTree: React.FC<{
  species: TreeSpecies;
  darkMode?: boolean;
  durationMinutes?: number;
}> = ({ species, darkMode = false }) => {
  const foliagePrimary = darkMode ? '#5E8A6C' : '#4A6B53';
  const foliageSecondary = darkMode ? '#79A887' : '#689676';
  const trunkColor = darkMode ? '#8C6D53' : '#75563E';

  return (
    <svg viewBox="0 0 48 56" className="w-10 h-12 overflow-visible" aria-hidden="true">
      <ellipse cx="24" cy="50" rx="14" ry="3" fill={darkMode ? '#232D26' : '#DFD8CC'} />
      <path d="M 22.5 50 L 23.2 30 L 24.8 30 L 25.5 50 Z" fill={trunkColor} />

      {species === 'cypress' && (
        <g>
          <ellipse cx="24" cy="24" rx="8" ry="17" fill={foliagePrimary} />
          <ellipse cx="22.5" cy="22" rx="5.5" ry="14" fill={foliageSecondary} />
        </g>
      )}

      {species === 'olive' && (
        <g>
          <circle cx="17" cy="26" r="8.5" fill={foliagePrimary} />
          <circle cx="31" cy="26" r="8.5" fill={foliagePrimary} />
          <circle cx="24" cy="19" r="10.5" fill={foliageSecondary} />
          <circle cx="21" cy="17" r="1.5" fill="#F4EFE6" />
          <circle cx="28" cy="23" r="1.5" fill="#F4EFE6" />
        </g>
      )}

      {species === 'maple' && (
        <g>
          <circle cx="18" cy="27" r="8" fill={darkMode ? '#6A8D67' : '#587B55'} />
          <circle cx="30" cy="27" r="8" fill={darkMode ? '#6A8D67' : '#587B55'} />
          <circle cx="24" cy="18" r="11" fill={darkMode ? '#83A87E' : '#6D936A'} />
        </g>
      )}

      {species === 'birch' && (
        <g>
          <path d="M 22.8 50 L 23.4 28 L 24.6 28 L 25.2 50 Z" fill={darkMode ? '#D6CFC2' : '#E5DFD3'} />
          <circle cx="18" cy="24" r="7.5" fill={foliageSecondary} />
          <circle cx="30" cy="25" r="7.5" fill={foliagePrimary} />
          <circle cx="24" cy="16" r="9.5" fill={foliageSecondary} />
        </g>
      )}

      {(species === 'oak' || !species) && (
        <g>
          <circle cx="16" cy="27" r="8" fill={foliagePrimary} />
          <circle cx="32" cy="27" r="8" fill={foliagePrimary} />
          <circle cx="20" cy="18" r="9" fill={foliageSecondary} />
          <circle cx="28" cy="19" r="8.5" fill={foliagePrimary} />
          <circle cx="24" cy="15" r="8" fill={foliageSecondary} />
          <circle cx="24" cy="14" r="1.6" fill="#F4EFE6" />
        </g>
      )}
    </svg>
  );
};
