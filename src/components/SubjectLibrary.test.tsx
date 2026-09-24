import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { subjects, type Subject } from '../domain/subjects';
import SubjectLibrary from './SubjectLibrary';

describe('Fächerbibliothek', () => {
  it('zeigt die Fachbeschreibungen und öffnet das gewählte Fach', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SubjectLibrary
        subjects={subjects}
        selected="mathematics"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('2 Fächer für dich');
    expect(screen.getByRole('button', { name: 'Mathematik' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Englisch' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    for (const subject of subjects) {
      expect(screen.getByText(subject.description)).toBeVisible();
    }

    await user.click(screen.getByRole('button', { name: 'Englisch' }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('english');
  });

  it('findet Fachnamen unabhängig von Großschreibung und äußeren Leerzeichen', async () => {
    const user = userEvent.setup();
    render(
      <SubjectLibrary
        subjects={subjects}
        selected="mathematics"
        onSelect={vi.fn()}
      />,
    );

    await user.type(
      screen.getByRole('searchbox', { name: 'Fach suchen' }),
      '  eNgL  ',
    );
    expect(screen.getByRole('button', { name: 'Englisch' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Mathematik' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 Fach gefunden');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('hilft bei einer Suche ohne Treffer und zeigt nach dem Löschen wieder alle Fächer', async () => {
    const user = userEvent.setup();
    render(
      <SubjectLibrary
        subjects={subjects}
        selected="mathematics"
        onSelect={vi.fn()}
      />,
    );
    const search = screen.getByRole('searchbox', { name: 'Fach suchen' });

    await user.type(search, 'unbekannt');
    expect(
      screen.getByRole('heading', { name: 'Kein Fach gefunden' }),
    ).toBeVisible();
    expect(
      screen.getByText(/Ändere deine Suche oder lösche sie/),
    ).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('0 Fächer gefunden');

    await user.click(screen.getByRole('button', { name: 'Suche löschen' }));
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Mathematik' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Englisch' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Suche löschen' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Kein Fach gefunden' }),
    ).not.toBeInTheDocument();
  });

  it('macht auch in einer großen Sammlung lange Fachnamen auffindbar und auswählbar', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    // UI-only fixtures exercise growth without adding unsupported product subjects.
    const manySubjects = Array.from({ length: 40 }, (_, index) => ({
      id: `test-subject-${index}`,
      name: `Testfach ${index + 1}: Entdecken, Forschen und Zusammenhänge verstehen`,
      symbol: '✦',
      description: `Beschreibung für Testfach ${index + 1}.`,
    })) as unknown as Subject[];
    render(
      <SubjectLibrary
        subjects={manySubjects}
        selected={manySubjects[0].id}
        onSelect={onSelect}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(40);
    expect(screen.getByRole('status')).toHaveTextContent('40 Fächer für dich');
    const lastSubject = manySubjects[39];
    await user.type(
      screen.getByRole('searchbox', { name: 'Fach suchen' }),
      'Testfach 40:',
    );
    expect(
      screen.getByRole('button', { name: lastSubject.name }),
    ).toHaveTextContent(lastSubject.name);
    await user.click(screen.getByRole('button', { name: lastSubject.name }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(lastSubject.id);
  });
});
