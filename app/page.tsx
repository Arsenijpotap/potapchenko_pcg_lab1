'use client';
import { useState } from 'react';
import { GamutStrategy, Illuminant, SeparationAlgorithm } from '../src/model/color';
import { ColorState, stateForIlluminant, stateForSeparation, stateFromHsv } from '../src/controller/color-controller';
import { ColorSettings } from '../src/view/ColorSettings';
import { ColorWorkspace } from '../src/view/ColorWorkspace';
export default function Page(){
 const [state,setState]=useState<ColorState>(()=>stateFromHsv({h:0,s:100,v:100},'D65','GCR'));
 const [illuminant,setIlluminant]=useState<Illuminant>('D65'); const [strategy,setStrategy]=useState<GamutStrategy>('clipping'); const [separation,setSeparation]=useState<SeparationAlgorithm>('GCR');
 const changeIlluminant=(v:Illuminant)=>{setIlluminant(v);setState(stateForIlluminant(state,v,separation));}; const changeSeparation=(v:SeparationAlgorithm)=>{setSeparation(v);setState(stateForSeparation(state,v));};
 return <main className="page"><ColorSettings illuminant={illuminant} strategy={strategy} separation={separation} onIlluminant={changeIlluminant} onStrategy={setStrategy} onSeparation={changeSeparation}/><ColorWorkspace state={state} illuminant={illuminant} strategy={strategy} separation={separation} setState={setState} setIlluminant={setIlluminant} setStrategy={setStrategy} setSeparation={setSeparation}/></main>;
}
