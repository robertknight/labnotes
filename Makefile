NODE_BIN=node_modules/.bin
TSC=$(NODE_BIN)/tsc -m commonjs -t es5 --outDir build

SRCS=$(wildcard src/*.ts)

all: $(SRCS)
	$(TSC) $(SRCS)
