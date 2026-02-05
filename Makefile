# Google Cloud Certification Flashcards Makefile

# Default target
.DEFAULT_GOAL := help

# Variables
NODE_BIN := ./node_modules/.bin
NPM := npm

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: help install dev build lint format clean test

## Show this help message
help:
	@echo "$(GREEN)Google Cloud Certification Flashcards - Available Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev        - Run the app in development mode"
	@echo "  make build      - Build the app for production"
	@echo "  make test       - Run tests"
	@echo ""
	@echo "$(YELLOW)Code Quality:$(NC)"
	@echo "  make lint       - Run linting and formatting across all files"
	@echo "  make lint-check - Check linting without fixing"
	@echo "  make format     - Format code with prettier"
	@echo "  make format-check - Check formatting without fixing"
	@echo ""
	@echo "$(YELLOW)Setup:$(NC)"
	@echo "  make install    - Install dependencies"
	@echo "  make setup      - Full setup (install deps + prepare git hooks)"
	@echo "  make clean      - Clean build artifacts and node_modules"
	@echo ""

## Install dependencies
install:
	@echo "$(GREEN)Installing dependencies...$(NC)"
	$(NPM) install

## Full setup including git hooks
setup: install
	@echo "$(GREEN)Setting up git hooks...$(NC)"
	$(NPM) run prepare

## A) Run the app in development mode
dev:
	@echo "$(GREEN)Starting development server...$(NC)"
	$(NPM) start

## B) Build the app into a static app
build:
	@echo "$(GREEN)Building application for production...$(NC)"
	$(NPM) run build
	@echo "$(GREEN)Build complete! Static files are in the 'build' directory.$(NC)"

## C) Run linting and formatting across all files
lint:
	@echo "$(GREEN)Running linting and formatting...$(NC)"
	$(NPM) run lint-and-format
	@echo "$(GREEN)Linting and formatting complete!$(NC)"

## Check linting without fixing
lint-check:
	@echo "$(GREEN)Checking linting...$(NC)"
	$(NPM) run lint

## Format code with prettier
format:
	@echo "$(GREEN)Formatting code...$(NC)"
	$(NPM) run format

## Check formatting without fixing
format-check:
	@echo "$(GREEN)Checking code formatting...$(NC)"
	$(NPM) run format:check

## Run tests
test:
	@echo "$(GREEN)Running tests...$(NC)"
	$(NPM) test

## Clean build artifacts and node_modules
clean:
	@echo "$(RED)Cleaning build artifacts...$(NC)"
	rm -rf build/
	rm -rf node_modules/
	rm -rf package-lock.json
	@echo "$(GREEN)Clean complete!$(NC)"

## Install dependencies and run in development mode
quick-start: install dev 