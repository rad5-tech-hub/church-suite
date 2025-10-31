import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import dayjs from "dayjs";
import MultiDatePicker from "./datepicker";

describe("MultiDatePicker Component", () => {
  const setup = (initial: string[] = []) => {
    const handleChange = jest.fn();
    render(<MultiDatePicker value={initial} onChange={handleChange} />);
    return { handleChange };
  };

  test("renders placeholder text when no dates are selected", () => {
    setup();
    expect(screen.getByText(/select dates.../i)).toBeInTheDocument();
  });

  test("renders chips when dates are passed in", () => {
    const today = dayjs().format("YYYY-MM-DD");
    setup([today]);
    expect(screen.getByText(dayjs(today).format("MMM D, YYYY"))).toBeInTheDocument();
  });

  test("opens calendar popover when icon is clicked", () => {
    setup();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByRole("presentation")).toBeInTheDocument(); // Popover container
  });

  test("selects a date and calls onChange", async () => {
    const { handleChange } = setup();

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Pick today's date cell
    const today = screen.getByRole("gridcell", { name: new RegExp(dayjs().date().toString()) });
    fireEvent.click(today);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith([dayjs().format("YYYY-MM-DD")]);
    });
  });

  test("removes a date when chip delete icon is clicked", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    const { handleChange } = setup([today]);

    const chip = screen.getByText(dayjs(today).format("MMM D, YYYY"));
    const deleteBtn = chip.closest("div")?.querySelector("svg"); // MUI delete icon is an <svg>
    expect(deleteBtn).toBeTruthy();

    fireEvent.click(deleteBtn!);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith([]);
    });
  });
});
