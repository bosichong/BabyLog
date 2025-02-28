"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function BabyFilter({ babies, selectedBabies, onBabiesChange }) {
  return (
    <div className="mb-6">
      <Label className="mb-2 block">选择要显示的宝宝记录</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {babies.map((baby) => (
          <div key={baby.id} className="flex items-center space-x-2">
            <Checkbox
              id={`filter-baby-${baby.id}`}
              checked={selectedBabies.includes(baby.id)}
              onCheckedChange={(checked) => {
                onBabiesChange(
                  checked
                    ? [...selectedBabies, baby.id]
                    : selectedBabies.filter((id) => id !== baby.id)
                );
              }}
            />
            <Label htmlFor={`filter-baby-${baby.id}`}>{baby.name}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}