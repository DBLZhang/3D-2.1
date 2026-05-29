import { useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useConfigStore, type ConeStyle } from "../stores";

const slideIn = keyframes`
  from {
    transform: translateX(120%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 5px rgba(143, 194, 255, 0.2); }
  50% { box-shadow: 0 0 15px rgba(143, 194, 255, 0.6); }
  100% { box-shadow: 0 0 5px rgba(143, 194, 255, 0.2); }
`;

const PanelContainer = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  width: 350px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  z-index: 1000;
  background: rgba(10, 15, 28, 0.72);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(143, 194, 255, 0.15);
  border-radius: 16px;
  padding: 24px;
  color: #e5f1ff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(143, 194, 255, 0.05);
  animation: ${slideIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(143, 194, 255, 0.2);
    border-radius: 3px;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(143, 194, 255, 0.1);
  padding-bottom: 12px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #a6d0ff;
  text-shadow: 0 0 8px rgba(143, 194, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(143, 194, 255, 0.1);
  color: #a6d0ff;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(143, 194, 255, 0.2);
    color: #ffffff;
    border-color: rgba(143, 194, 255, 0.3);
  }
`;

const Section = styled.div`
  margin-bottom: 22px;
  border-bottom: 1px solid rgba(143, 194, 255, 0.05);
  padding-bottom: 16px;

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #7fa6d9;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 6px;
`;

const ValueDisplay = styled.span`
  font-family: monospace;
  font-weight: 600;
  color: #00e5ff;
  text-shadow: 0 0 4px rgba(0, 229, 255, 0.3);
`;

const Slider = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  transition: background 0.3s;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #00e5ff;
    border: 2px solid #ffffff;
    box-shadow: 0 0 6px rgba(0, 229, 255, 0.8);
    cursor: pointer;
    transition: transform 0.1s, background-color 0.2s;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
`;

const ColorRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(143, 194, 255, 0.05);
  border-radius: 8px;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(143, 194, 255, 0.15);
  }
`;

const ColorLabel = styled.span`
  font-size: 13px;
  color: #cfddec;
`;

const ColorPickerContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColorHex = styled.span`
  font-size: 11px;
  font-family: monospace;
  color: #7fa6d9;
`;

const NativeColorInput = styled.input`
  opacity: 0;
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  cursor: pointer;
`;

const ColorPreviewCircle = styled.div<{ $color: string }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${(props) => props.$color};
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 8px ${(props) => props.$color};
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.15);
  }
`;

const ChipContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const Chip = styled.button<{ $active: boolean }>`
  background: ${(props) => (props.$active ? "rgba(0, 229, 255, 0.12)" : "rgba(255, 255, 255, 0.02)")};
  border: 1px solid ${(props) => (props.$active ? "rgba(0, 229, 255, 0.4)" : "rgba(143, 194, 255, 0.08)")};
  color: ${(props) => (props.$active ? "#00e5ff" : "#a6c7ec")};
  font-size: 11px;
  font-weight: 500;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  box-shadow: ${(props) => (props.$active ? "0 0 8px rgba(0, 229, 255, 0.25)" : "none")};

  &:hover {
    background: ${(props) => (props.$active ? "rgba(0, 229, 255, 0.18)" : "rgba(143, 194, 255, 0.08)")};
    border-color: ${(props) => (props.$active ? "rgba(0, 229, 255, 0.6)" : "rgba(143, 194, 255, 0.2)")};
    color: #ffffff;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
`;

const ResetButton = styled.button`
  background: linear-gradient(135deg, rgba(235, 87, 87, 0.1), rgba(235, 87, 87, 0.2));
  border: 1px solid rgba(235, 87, 87, 0.3);
  color: #ff8e8e;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.5px;
  text-align: center;

  &:hover {
    background: linear-gradient(135deg, rgba(235, 87, 87, 0.2), rgba(235, 87, 87, 0.35));
    border-color: rgba(235, 87, 87, 0.5);
    color: #ffffff;
    box-shadow: 0 0 10px rgba(235, 87, 87, 0.2);
  }
`;

const FloatingToggleButton = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 999;
  background: rgba(10, 15, 28, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(143, 194, 255, 0.2);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #00e5ff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  animation: ${pulseGlow} 3s infinite;
  transition: all 0.2s;

  &:hover {
    background: rgba(143, 194, 255, 0.15);
    border-color: rgba(0, 229, 255, 0.6);
    transform: scale(1.05);
  }
`;

const UploadButton = styled.label`
  background: rgba(143, 194, 255, 0.08);
  border: 1px dashed rgba(143, 194, 255, 0.3);
  color: #a6d0ff;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(143, 194, 255, 0.15);
    border-color: #00e5ff;
    color: #ffffff;
  }
`;

const ImagePreviewRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 229, 255, 0.03);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 8px;
  font-size: 12px;
`;

const RemoveImageBtn = styled.button`
  background: none;
  border: none;
  color: #ff8e8e;
  cursor: pointer;
  font-size: 11px;
  text-decoration: underline;
  padding: 0;

  &:hover {
    color: #ff5252;
  }
`;

const TilingBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
`;

const SwitchContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const SwitchSlider = styled.span<{ $checked: boolean }>`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${(props) => (props.$checked ? "rgba(0, 229, 255, 0.6)" : "rgba(255, 255, 255, 0.15)")};
  transition: .3s;
  border-radius: 20px;
  box-shadow: ${(props) => (props.$checked ? "0 0 6px rgba(0, 229, 255, 0.4)" : "none")};

  &:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
    transform: ${(props) => (props.$checked ? "translateX(16px)" : "translateX(0)")};
  }
`;

export default function CustomizerPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const floorFileInputRef = useRef<HTMLInputElement>(null);
  const skyFileInputRef = useRef<HTMLInputElement>(null);

  const {
    heightScale,
    beamColor,
    lightMainColor,
    lightFillColor,
    flyLineColor,
    labelColor,
    coneColor,
    coneStyle,
    bgColor,
    skirtColor,
    bgImage,
    bgRepeat,
    bgSize,
    floorColor,
    floorImage,
    floorRepeat,
    skyInclination,
    skyAzimuth,
    skyRayleigh,
    skyTurbidity,
    skyMode,
    skyPreset,
    skyImage,
    skySunGlow,
    skySunScale,
    floorImageMode,
    setField,
    reset,
  } = useConfigStore();

  const handleColorChange = (key: any, value: string) => {
    setField(key, value);
  };

  const handleStyleChange = (style: ConeStyle) => {
    setField("coneStyle", style);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setField("bgImage", event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setField("bgImage", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFloorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setField("floorImageMode", "custom");
        setField("floorImage", event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFloorImage = () => {
    setField("floorImage", null);
    if (floorFileInputRef.current) {
      floorFileInputRef.current.value = "";
    }
  };

  const handleSkyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setField("skyPreset", "none");
        setField("skyImage", event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSkyImage = () => {
    setField("skyPreset", "none");
    setField("skyImage", null);
    if (skyFileInputRef.current) {
      skyFileInputRef.current.value = "";
    }
  };

  const handleSelectSkyPreset = (preset: "none" | "sunset" | "orchard" | "night") => {
    setField("skyPreset", preset);
    if (preset === "none") {
      setField("skyImage", null);
    } else if (preset === "sunset") {
      setField("skyImage", "/skybox/belfast_sunset_puresky.jpg");
    } else if (preset === "orchard") {
      setField("skyImage", "/skybox/citrus_orchard_puresky.jpg");
    } else if (preset === "night") {
      setField("skyImage", "/skybox/rogland_clear_night.jpg");
    }
  };

  const handleSelectFloorMode = (mode: "color" | "texture" | "custom") => {
    setField("floorImageMode", mode);
    if (mode === "color") {
      setField("floorImage", null);
    } else if (mode === "texture") {
      setField("floorImage", "/textures/floor_texture_20x.png");
      setField("floorRepeat", 20);
    } else if (mode === "custom") {
      setField("floorImage", null);
    }
  };

  if (!isOpen) {
    return (
      <FloatingToggleButton onClick={() => setIsOpen(true)} title="打开配置面板">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </FloatingToggleButton>
    );
  }

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          沙盘参数配置
        </Title>
        <CloseButton onClick={() => setIsOpen(false)} title="折叠面板">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </CloseButton>
      </PanelHeader>

      {/* 地形设置 */}
      <Section>
        <SectionTitle>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
          </svg>
          地形高程与侧边
        </SectionTitle>
        <ControlGroup>
          <div>
            <LabelRow>
              <span>地形垂直缩放倍数</span>
              <ValueDisplay>{heightScale.toFixed(1)}x</ValueDisplay>
            </LabelRow>
            <Slider
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={heightScale}
              onChange={(e) => setField("heightScale", parseFloat(e.target.value))}
            />
          </div>
          
          <ColorRow>
            <ColorLabel>地图侧面厚度颜色</ColorLabel>
            <ColorPickerContainer>
              <ColorHex>{skirtColor}</ColorHex>
              <ColorPreviewCircle $color={skirtColor} />
              <NativeColorInput
                type="color"
                value={skirtColor}
                onChange={(e) => handleColorChange("skirtColor", e.target.value)}
              />
            </ColorPickerContainer>
          </ColorRow>
        </ControlGroup>
      </Section>

      {/* 天空与昼夜系统 */}
      <Section>
        <SectionTitle>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h-2M6.34 17.66l-1.41 1.41M12 20v2M19.07 19.07l-1.41-1.41M22 12h-2M17.66 6.34l1.41-1.41" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          天空与昼夜系统 (Atmospheric & Skybox)
        </SectionTitle>
        <ControlGroup>
          <div>
            <span style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>天空背景显示模式</span>
            <ChipContainer>
              <Chip $active={skyMode === "procedural"} onClick={() => setField("skyMode", "procedural")}>
                💡 物理大气 (动态昼夜)
              </Chip>
              <Chip $active={skyMode === "panorama"} onClick={() => setField("skyMode", "panorama")}>
                🌌 360° 全景背景贴图
              </Chip>
            </ChipContainer>
          </div>

          {skyMode === "procedural" ? (
            <>
              <div>
                <LabelRow>
                  <span>太阳高度 / 昼夜时间</span>
                  <ValueDisplay>
                    {skyInclination > 0.15 ? "☀️ 白昼" : skyInclination > 0.0 ? "🌅 黄昏" : "🌌 极夜"} ({skyInclination.toFixed(2)})
                  </ValueDisplay>
                </LabelRow>
                <Slider
                  type="range"
                  min="-0.05"
                  max="0.55"
                  step="0.01"
                  value={skyInclination}
                  onChange={(e) => setField("skyInclination", parseFloat(e.target.value))}
                />
              </div>

              <div>
                <LabelRow>
                  <span>太阳方位角 (自转方向)</span>
                  <ValueDisplay>{skyAzimuth.toFixed(2)}</ValueDisplay>
                </LabelRow>
                <Slider
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  value={skyAzimuth}
                  onChange={(e) => setField("skyAzimuth", parseFloat(e.target.value))}
                />
              </div>

              <div>
                <LabelRow>
                  <span>大气散射厚度 (Rayleigh)</span>
                  <ValueDisplay>{skyRayleigh.toFixed(1)}</ValueDisplay>
                </LabelRow>
                <Slider
                  type="range"
                  min="0.0"
                  max="10.0"
                  step="0.1"
                  value={skyRayleigh}
                  onChange={(e) => setField("skyRayleigh", parseFloat(e.target.value))}
                />
              </div>

              <div>
                <LabelRow>
                  <span>空气浑浊度 (Haze / Turbidity)</span>
                  <ValueDisplay>{skyTurbidity.toFixed(1)}</ValueDisplay>
                </LabelRow>
                <Slider
                  type="range"
                  min="0.0"
                  max="20.0"
                  step="0.1"
                  value={skyTurbidity}
                  onChange={(e) => setField("skyTurbidity", parseFloat(e.target.value))}
                />
              </div>
            </>
          ) : (
            <div>
              <span style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>内置 360° 全景天空预设</span>
              <ChipContainer style={{ marginBottom: "12px" }}>
                <Chip $active={skyPreset === "sunset"} onClick={() => handleSelectSkyPreset("sunset")}>
                  🌅 贝尔法斯特黄昏
                </Chip>
                <Chip $active={skyPreset === "orchard"} onClick={() => handleSelectSkyPreset("orchard")}>
                  🍊 柑橘果园
                </Chip>
                <Chip $active={skyPreset === "night"} onClick={() => handleSelectSkyPreset("night")}>
                  🌌 罗格兰晴空夜
                </Chip>
              </ChipContainer>

              <span style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>自定义全景天空 (支持拖入上传)</span>
              {skyImage && skyPreset === "none" ? (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <img
                    src={skyImage}
                    alt="skybox preview"
                    style={{ width: "90px", height: "45px", borderRadius: "4px", border: "1px solid #444", objectFit: "cover" }}
                  />
                  <RemoveImageBtn onClick={handleRemoveSkyImage} style={{ flex: 1, padding: "8px", borderRadius: "6px" }}>
                    🗑️ 移除并使用内置星空
                  </RemoveImageBtn>
                </div>
              ) : (
                <UploadButton style={{ width: "100%", padding: "10px" }}>
                  📁 上传 2:1 自定义全景图
                  <input
                    ref={skyFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSkyImageUpload}
                    style={{ display: "none" }}
                  />
                </UploadButton>
              )}
            </div>
          )}

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />

          {/* 3D Glowing Sun Entity controls */}
          <TilingBox>
            <span>3D 实体发光太阳 (3D Sun body)</span>
            <SwitchContainer>
              <SwitchInput
                type="checkbox"
                checked={skySunGlow}
                onChange={(e) => setField("skySunGlow", e.target.checked)}
              />
              <SwitchSlider $checked={skySunGlow} />
            </SwitchContainer>
          </TilingBox>

          {skySunGlow && (
            <div>
              <LabelRow>
                <span>3D 发光太阳尺寸</span>
                <ValueDisplay>{skySunScale.toFixed(0)}x</ValueDisplay>
              </LabelRow>
              <Slider
                type="range"
                min="2.0"
                max="30.0"
                step="1.0"
                value={skySunScale}
                onChange={(e) => setField("skySunScale", parseFloat(e.target.value))}
              />
            </div>
          )}
        </ControlGroup>
      </Section>

      {/* 地平面渐变与纹理 */}
      <Section>
        <SectionTitle>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          地平面渐变与纹理 (Floor Tiling)
        </SectionTitle>
        <ControlGroup>
          <ColorRow>
            <ColorLabel>地平渐变底色 (中心色)</ColorLabel>
            <ColorPickerContainer>
              <ColorHex>{floorColor}</ColorHex>
              <ColorPreviewCircle $color={floorColor} />
              <NativeColorInput
                type="color"
                value={floorColor}
                onChange={(e) => handleColorChange("floorColor", e.target.value)}
              />
            </ColorPickerContainer>
          </ColorRow>

          <div>
            <span style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>地面填充样式</span>
            <ChipContainer style={{ marginBottom: "12px" }}>
              <Chip $active={floorImageMode === "color"} onClick={() => handleSelectFloorMode("color")}>
                🎨 纯色与渐变
              </Chip>
              <Chip $active={floorImageMode === "texture"} onClick={() => handleSelectFloorMode("texture")}>
                🏁 内置 20x 拼接纹理
              </Chip>
              <Chip $active={floorImageMode === "custom"} onClick={() => handleSelectFloorMode("custom")}>
                📁 自定义纹理上传
              </Chip>
            </ChipContainer>
          </div>

          {floorImageMode === "custom" && (
            <div>
              <span style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>上传点阵 / 拼接纹理</span>
              {floorImage && floorImage !== "/textures/floor_texture_20x.png" ? (
                <ImagePreviewRow>
                  <span style={{ color: "#a6d0ff" }}>已成功载入自定义纹理</span>
                  <RemoveImageBtn onClick={handleRemoveFloorImage}>清除自定义纹理</RemoveImageBtn>
                </ImagePreviewRow>
              ) : (
                <UploadButton style={{ width: "100%", padding: "10px" }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  上传点阵 / 拼接纹理 (JPG/PNG)
                  <input
                    ref={floorFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFloorImageUpload}
                    style={{ display: "none" }}
                  />
                </UploadButton>
              )}
            </div>
          )}

          {floorImage && (
            <div>
              <LabelRow>
                <span>平铺拼接重复次数</span>
                <ValueDisplay>{floorRepeat}x</ValueDisplay>
              </LabelRow>
              <Slider
                type="range"
                min="1"
                max="100"
                step="1"
                value={floorRepeat}
                onChange={(e) => setField("floorRepeat", parseInt(e.target.value))}
              />
            </div>
          )}
        </ControlGroup>
      </Section>

      {/* 背景环境配置 */}
      <Section>
        <SectionTitle>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          大屏背景环境
        </SectionTitle>
        <ControlGroup>
          <ColorRow>
            <ColorLabel>纯色背景底色</ColorLabel>
            <ColorPickerContainer>
              <ColorHex>{bgColor}</ColorHex>
              <ColorPreviewCircle $color={bgColor} />
              <NativeColorInput
                type="color"
                value={bgColor}
                onChange={(e) => handleColorChange("bgColor", e.target.value)}
              />
            </ColorPickerContainer>
          </ColorRow>

          <div>
            <span style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>上传自定义背景图</span>
            {bgImage ? (
              <ImagePreviewRow>
                <span style={{ color: "#a6d0ff" }}>已成功载入自定义图片</span>
                <RemoveImageBtn onClick={handleRemoveImage}>清除背景图</RemoveImageBtn>
              </ImagePreviewRow>
            ) : (
              <UploadButton>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                上传图片 (JPG/PNG)
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </UploadButton>
            )}
          </div>

          {bgImage && (
            <>
              <TilingBox>
                <span>图片平铺重复 (Tiling)</span>
                <SwitchContainer>
                  <SwitchInput
                    type="checkbox"
                    checked={bgRepeat}
                    onChange={(e) => setField("bgRepeat", e.target.checked)}
                  />
                  <SwitchSlider $checked={bgRepeat} />
                </SwitchContainer>
              </TilingBox>

              {bgRepeat && (
                <div>
                  <LabelRow>
                    <span>平铺单元尺寸 (Scale)</span>
                    <ValueDisplay>{bgSize}px</ValueDisplay>
                  </LabelRow>
                  <Slider
                    type="range"
                    min="50"
                    max="800"
                    step="5"
                    value={bgSize}
                    onChange={(e) => setField("bgSize", parseInt(e.target.value))}
                  />
                </div>
              )}
            </>
          )}
        </ControlGroup>
      </Section>

      {/* 灯光配置 */}
      <Section>
        <SectionTitle>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          场景灯光配置
        </SectionTitle>
        <ControlGroup>
          <ColorRow>
            <ColorLabel>主射光/环境光颜色</ColorLabel>
            <ColorPickerContainer>
              <ColorHex>{lightMainColor}</ColorHex>
              <ColorPreviewCircle $color={lightMainColor} />
              <NativeColorInput
                type="color"
                value={lightMainColor}
                onChange={(e) => handleColorChange("lightMainColor", e.target.value)}
              />
            </ColorPickerContainer>
          </ColorRow>
          <ColorRow>
            <ColorLabel>侧向补光颜色</ColorLabel>
            <ColorPickerContainer>
              <ColorHex>{lightFillColor}</ColorHex>
              <ColorPreviewCircle $color={lightFillColor} />
              <NativeColorInput
                type="color"
                value={lightFillColor}
                onChange={(e) => handleColorChange("lightFillColor", e.target.value)}
              />
            </ColorPickerContainer>
          </ColorRow>
        </ControlGroup>
      </Section>

      {/* 特效元素 */}
      <Section>
        <SectionTitle>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          业务与发光特效
        </SectionTitle>
        <ControlGroup>
          <ColorRow>
            <ColorLabel>流光飞线颜色</ColorLabel>
            <ColorPickerContainer>
              <ColorHex>{flyLineColor}</ColorHex>
              <ColorPreviewCircle $color={flyLineColor} />
              <NativeColorInput
                type="color"
                value={flyLineColor}
                onChange={(e) => handleColorChange("flyLineColor", e.target.value)}
              />
            </ColorPickerContainer>
          </ColorRow>
          <ColorRow>
            <ColorLabel>垂直上升光柱颜色</ColorLabel>
            <ColorPickerContainer>
              <ColorHex>{beamColor}</ColorHex>
              <ColorPreviewCircle $color={beamColor} />
              <NativeColorInput
                type="color"
                value={beamColor}
                onChange={(e) => handleColorChange("beamColor", e.target.value)}
              />
            </ColorPickerContainer>
          </ColorRow>
        </ControlGroup>
      </Section>

      {/* 标点管理 */}
      <Section>
        <SectionTitle>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          地名标点控制
        </SectionTitle>
        <ControlGroup>
          <ColorRow>
            <ColorLabel>标点本体/光圈颜色</ColorLabel>
            <ColorPickerContainer>
              <ColorHex>{coneColor}</ColorHex>
              <ColorPreviewCircle $color={coneColor} />
              <NativeColorInput
                type="color"
                value={coneColor}
                onChange={(e) => handleColorChange("coneColor", e.target.value)}
              />
            </ColorPickerContainer>
          </ColorRow>
          <ColorRow>
            <ColorLabel>地名文字字体颜色</ColorLabel>
            <ColorPickerContainer>
              <ColorHex>{labelColor}</ColorHex>
              <ColorPreviewCircle $color={labelColor} />
              <NativeColorInput
                type="color"
                value={labelColor}
                onChange={(e) => handleColorChange("labelColor", e.target.value)}
              />
            </ColorPickerContainer>
          </ColorRow>

          <div>
            <span style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>标点立体几何样式</span>
            <ChipContainer>
              <Chip $active={coneStyle === "cone"} onClick={() => handleStyleChange("cone")}>
                💎 三棱锥
              </Chip>
              <Chip $active={coneStyle === "smooth-cone"} onClick={() => handleStyleChange("smooth-cone")}>
                🗼 圆锥
              </Chip>
              <Chip $active={coneStyle === "cylinder"} onClick={() => handleStyleChange("cylinder")}>
                🔋 圆柱
              </Chip>
              <Chip $active={coneStyle === "sphere"} onClick={() => handleStyleChange("sphere")}>
                🔮 晶球
              </Chip>
              <Chip $active={coneStyle === "box"} onClick={() => handleStyleChange("box")}>
                📦 方块
              </Chip>
            </ChipContainer>
          </div>
        </ControlGroup>
      </Section>

      {/* 重置 */}
      <ButtonRow>
        <ResetButton onClick={reset}>
          🔄 恢复沙盘出厂配置
        </ResetButton>
      </ButtonRow>
    </PanelContainer>
  );
}
