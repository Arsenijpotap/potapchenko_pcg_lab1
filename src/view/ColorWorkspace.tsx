'use client';
import { CMYK, HSV, LAB, rgbToHex, hexToRgb, rgbToCmyk, cmykToRgb, labToRgbWithGamut, Illuminant, GamutStrategy, SeparationAlgorithm } from '../model/color';
import { ColorState, stateFromCmyk, stateFromHsv, stateFromLab } from '../controller/color-controller';
import { ColorModelCard } from './ColorModelCard';
import { SliderItem } from './slider-types';

const CMYK_FIELDS: SliderItem<CMYK>[] = [['c','C',0,100,.1],['m','M',0,100,.1],['y','Y',0,100,.1],['k','K',0,100,.1]];
const LAB_FIELDS: SliderItem<LAB>[] = [['l','L*',0,100,.1],['a','a*',-128,127,.1],['b','b*',-128,127,.1]];
const HSV_FIELDS: SliderItem<HSV>[] = [['h','H°',0,360,.1],['s','S%',0,100,.1],['v','V%',0,100,.1]];
const hsvRgb = (x: HSV) => { const S=x.s/100,V=x.v/100,C=V*S,H=x.h/60,X=C*(1-Math.abs(H%2-1)),m=V-C; let r=0,g=0,b=0;if(x.h<60){r=C;g=X}else if(x.h<120){r=X;g=C}else if(x.h<180){g=C;b=X}else if(x.h<240){g=X;b=C}else if(x.h<300){r=X;b=C}else{r=C;b=X} return {r:(r+m)*255,g:(g+m)*255,b:(b+m)*255}; };
export function ColorWorkspace({ state, illuminant, strategy, separation, setState, setIlluminant, setStrategy, setSeparation }: { state: ColorState; illuminant: Illuminant; strategy: GamutStrategy; separation: SeparationAlgorithm; setState: (s: ColorState)=>void; setIlluminant:(v: Illuminant)=>void; setStrategy:(v:GamutStrategy)=>void; setSeparation:(v:SeparationAlgorithm)=>void }) {
 const {rgb,cmyk,lab,hsv}=state, hex=rgbToHex(rgb), gamut=labToRgbWithGamut(lab,illuminant,strategy);
 const updateCmyk=(key:keyof CMYK,value:number)=>setState(stateFromCmyk({...cmyk,[key]:value},illuminant,separation));
 const updateLab=(key:keyof LAB,value:number)=>setState(stateFromLab({...lab,[key]:value},illuminant,strategy,separation));
 const updateHsv=(key:keyof HSV,value:number)=>setState(stateFromHsv({...hsv,[key]:value},illuminant,separation));
 const gradient=<T extends Record<string,number>>(items:SliderItem<T>[],values:T,key:keyof T,toRgb:(v:T)=>{r:number;g:number;b:number})=>{const [, ,min,max]=items.find(x=>x[0]===key)!;return `linear-gradient(to right, ${Array.from({length:13},(_,i)=>{const candidate={...values,[key]:min+(max-min)*i/12} as T;return rgbToHex(toRgb(candidate));}).join(', ')})`;};
 return <>
  <div className="head"><div className="title"><h1>CMYK ↔ LAB ↔ HSV</h1><p>Интерактивное ручное преобразование трёх цветовых моделей</p><div className="color-tools"><input className="native-picker" type="color" value={hex} onChange={e=>setState(stateFromCmyk(rgbToCmyk(hexToRgb(e.target.value),separation),illuminant,separation))}/><span className="hex-label">{hex.toUpperCase()}</span></div></div><div className="swatch" style={{background:hex}} /></div>
  <div className="grid"><ColorModelCard title="CMYK" note="Градиент показывает результат изменения этой компоненты при текущих остальных." items={CMYK_FIELDS} values={cmyk} update={updateCmyk} gradientFor={key=>gradient(CMYK_FIELDS,cmyk,key,v=>{const x=v as CMYK;return cmykToRgb(x)})}/><ColorModelCard title="LAB" note="Градиент рассчитывается с учётом выбранного освещения и стратегии гамута." items={LAB_FIELDS} values={lab} update={updateLab} gradientFor={key=>gradient(LAB_FIELDS,lab,key,v=>labToRgbWithGamut(v as LAB,illuminant,strategy).rgb)}/><ColorModelCard title="HSV" note="Градиент показывает все промежуточные оттенки при текущих двух других компонентах." items={HSV_FIELDS} values={hsv} update={updateHsv} gradientFor={key=>gradient(HSV_FIELDS,hsv,key,v=>hsvRgb(v as HSV))}/></div>
  {gamut.clipped&&<div className="notice" role="status">Цвет LAB выходит за RGB-гамут. Применена стратегия «{strategy==='clipping'?'обрезание':'масштабирование'}».</div>}
 </>;
}
