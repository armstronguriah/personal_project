
import * as Select from '@radix-ui/react-select';

export default function StyledSelect({
                                         id,
                                         name,
                                         value,
                                         onValueChange,
                                         placeholder,
                                         options,
                                         required = false
                                     }) {
    return (
        <Select.Root
            name={name}
            value={value}
            onValueChange={onValueChange}
            required={required}
        >
            <Select.Trigger
                id={id}
                className="flex h-12 w-full items-center justify-between rounded-lg border border-slate-300
                bg-white px-4 pr-5 text-left text-sm text-slate-900 outline-none transition hover:border-blue-400
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
                <Select.Value placeholder={placeholder} />

                <Select.Icon>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-500"
                        aria-hidden="true"
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
                <Select.Content
                    position="popper"
                    sideOffset={6}
                    className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border
                    border-slate-200 bg-white p-1 shadow-xl"
                >
                    <Select.Viewport>
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                className="relative flex cursor-pointer select-none items-center rounded-lg px-4
                                py-3 pr-10 text-sm text-slate-700 outline-none data-[highlighted]:bg-blue-50
                                data-[highlighted]:text-blue-700"
                            >
                                <Select.ItemText>
                                    {option.label}
                                </Select.ItemText>

                                <Select.ItemIndicator className="absolute right-3 text-blue-600">
                                    ✓
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}
