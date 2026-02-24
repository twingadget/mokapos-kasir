"use client";

type SelectOption = {
    value: string;
    label: string;
};

type AutoSubmitSelectProps = {
    id: string;
    name: string;
    defaultValue: string;
    className?: string;
    options: SelectOption[];
};

export default function AutoSubmitSelect({ id, name, defaultValue, className, options }: AutoSubmitSelectProps) {
    return (
        <select id={id} name={name} defaultValue={defaultValue} className={className} onChange={(event) => event.currentTarget.form?.submit()}>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
