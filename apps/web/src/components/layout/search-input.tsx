'use client';
import { Search } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { ButtonGroup } from '../ui/button-group';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type Props = {
  onSearch: (value: string) => void;
  value: string;
} & React.ComponentPropsWithoutRef<'input'>;

export default function SearchInput({ onSearch, value, ...inputProps }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      inputRef.current?.focus();
      return;
    }
    onSearch(value);
  };

  const onBlur = () => {
    if ((!value || value.trim().length === 0) && isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <ButtonGroup>
      <Button variant="outline" className="rounded" onClick={handleClick}>
        <Search />
      </Button>
      <Input
        {...inputProps}
        ref={inputRef}
        placeholder="Search..."
        onBlur={onBlur}
        value={value}
        className={cn(
          'transition-all ease-in-out duration-300 rounded',
          isOpen ? 'max-w-full' : 'max-w-0 p-0 border-none',
        )}
      />
    </ButtonGroup>
  );
}
