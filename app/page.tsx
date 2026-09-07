'use client';

import { ColorSettings } from '../src/view/ColorSettings';
import { ColorWorkspace } from '../src/view/ColorWorkspace';
import { useColorController } from '../src/controller/use-color-controller';

export default function Page() {
  const controller = useColorController();

  return (
    <main className="page">
      <ColorSettings
        illuminant={controller.illuminant}
        strategy={controller.strategy}
        separation={controller.separation}
        onIlluminant={controller.changeIlluminant}
        onStrategy={controller.changeStrategy}
        onSeparation={controller.changeSeparation}
      />
      <ColorWorkspace
        state={controller.state}
        illuminant={controller.illuminant}
        strategy={controller.strategy}
        hex={controller.hex}
        gamutClipped={controller.gamutClipped}
        cmykFields={controller.cmykFields}
        labFields={controller.labFields}
        hsvFields={controller.hsvFields}
        changeCmyk={controller.changeCmyk}
        changeLab={controller.changeLab}
        changeHsv={controller.changeHsv}
        changeHex={controller.changeHex}
        gradients={controller.gradients}
      />
    </main>
  );
}
